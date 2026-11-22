import type { AggSpec, ChartQuery, ColumnSpec, DataRow, FilterExpr, Table, Value } from './types';
import { binEndOutput, binOutput, inferResultSchema, isAggregated, validateQuery } from './validate';

export class QueryError extends Error {
  constructor(
    public queryId: string,
    public errors: string[],
  ) {
    super(`query "${queryId}" is invalid:\n- ${errors.join('\n- ')}`);
  }
}

const num = (v: Value): number | null => (typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : null);

/** Nulls sort last; categorical columns with declared levels sort by level order. */
export function compareValues(a: Value, b: Value, col?: ColumnSpec): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (col?.levels) {
    const ia = col.levels.indexOf(String(a));
    const ib = col.levels.indexOf(String(b));
    if (ia !== -1 && ib !== -1) return ia - ib;
  }
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a ? 1 : -1;
  return String(a) < String(b) ? -1 : 1;
}

function matches(v: Value, f: FilterExpr): boolean {
  const target = f.value as Value;
  switch (f.op) {
    case 'is_null':
      return v === null;
    case 'not_null':
      return v !== null;
    case 'eq':
      return v === target;
    case 'neq':
      return v !== target;
    case 'in':
      return (f.value as Value[]).includes(v);
    case 'not_in':
      return !(f.value as Value[]).includes(v);
  }
  if (v === null || target === null) return false;
  const c = compareValues(v, target);
  switch (f.op) {
    case 'gt':
      return c > 0;
    case 'gte':
      return c >= 0;
    case 'lt':
      return c < 0;
    case 'lte':
      return c <= 0;
  }
}

function rowsMatching(rows: DataRow[], where: FilterExpr | undefined): DataRow[] {
  if (!where) return rows;
  return rows.filter((r) => matches(r[where.column], where));
}

function aggregateGroup(rows: DataRow[], a: AggSpec): Value {
  if (a.fn === 'count_if') {
    return rowsMatching(rows, a.where).length;
  }
  if (a.fn === 'share') {
    if (a.where) {
      if (!rows.length) return null;
      return rowsMatching(rows, a.where).length / rows.length;
    }
    // Boolean / truthy rate on `column` (preferred over mean for rates).
    if (!a.column) return null;
    if (!rows.length) return null;
    let hits = 0;
    for (const r of rows) {
      const v = r[a.column];
      if (v === true) hits += 1;
      else if (typeof v === 'number') hits += v;
      else if (typeof v === 'string' && v.length > 0) hits += 1;
    }
    return hits / rows.length;
  }
  if (a.fn === 'sum_if' || a.fn === 'mean_if') {
    const subset = rowsMatching(rows, a.where);
    const nums = subset.map((r) => num(r[a.column!])).filter((v): v is number => v !== null);
    if (a.fn === 'sum_if') return nums.reduce((s, v) => s + v, 0);
    if (!nums.length) return null;
    return nums.reduce((s, v) => s + v, 0) / nums.length;
  }
  if (a.fn === 'count') return a.column ? rows.filter((r) => r[a.column!] !== null).length : rows.length;
  const values = rows.map((r) => r[a.column!]).filter((v): v is Exclude<Value, null> => v !== null);
  if (a.fn === 'count_distinct') return new Set(values).size;
  if (a.fn === 'ratio') {
    let n = 0;
    let d = 0;
    for (const r of rows) {
      n += num(r[a.column!]) ?? 0;
      d += num(r[a.denominator!]) ?? 0;
    }
    return d === 0 ? null : n / d;
  }
  if (a.fn === 'min' || a.fn === 'max') {
    if (!values.length) return null;
    const sorted = [...values].sort((x, y) => compareValues(x, y));
    return a.fn === 'min' ? sorted[0] : sorted[sorted.length - 1];
  }
  const nums = values.map(num).filter((v): v is number => v !== null);
  if (a.fn === 'sum') return nums.reduce((s, v) => s + v, 0);
  if (!nums.length) return null;
  if (a.fn === 'mean') return nums.reduce((s, v) => s + v, 0) / nums.length;
  const sorted = [...nums].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic sample of n rows, preserving input order. */
function sampleRows(rows: DataRow[], n: number, seed = 1): DataRow[] {
  if (rows.length <= n) return rows;
  const rand = mulberry32(seed);
  const idx = rows.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx
    .slice(0, n)
    .sort((x, y) => x - y)
    .map((i) => rows[i]);
}

const roundBin = (v: number) => Math.round(v * 1e9) / 1e9;

/**
 * Runs a query object against the canonical table:
 * filter → bin → group/aggregate → sample → orderBy → limit.
 */
export function runQuery(table: Table, query: ChartQuery): DataRow[] {
  const errors = validateQuery(query, table.schema);
  if (errors.length) throw new QueryError(query.id ?? query.label ?? 'inline', errors);

  let rows = table.rows;
  if (query.filter?.length) rows = rows.filter((r) => query.filter!.every((f) => matches(r[f.column], f)));

  if (query.bin?.length) {
    rows = rows.map((r) => {
      const out = { ...r };
      for (const b of query.bin!) {
        const v = num(r[b.column]);
        const start = v === null ? null : roundBin(Math.floor(v / b.step) * b.step);
        out[binOutput(b)] = start;
        out[binEndOutput(b)] = start === null ? null : roundBin(start + b.step);
      }
      return out;
    });
  }

  const resultSchema = inferResultSchema(query, table.schema);
  const colOf = new Map(resultSchema.map((c) => [c.name, c]));

  if (isAggregated(query)) {
    const keys = [...(query.groupBy ?? []), ...(query.bin ?? []).flatMap((b) => [binOutput(b), binEndOutput(b)])];
    const groups = new Map<string, DataRow[]>();
    for (const r of rows) {
      const k = JSON.stringify(keys.map((key) => r[key]));
      const g = groups.get(k);
      if (g) g.push(r);
      else groups.set(k, [r]);
    }
    const out: DataRow[] = [];
    for (const g of groups.values()) {
      const row: DataRow = {};
      for (const k of keys) row[k] = g[0][k];
      for (const a of query.aggregate ?? []) row[a.as] = aggregateGroup(g, a);
      out.push(row);
    }
    if (!query.groupBy?.length && !query.bin?.length && out.length === 0) {
      const row: DataRow = {};
      for (const a of query.aggregate ?? []) row[a.as] = aggregateGroup([], a);
      out.push(row);
    }
    out.sort((x, y) => {
      for (const k of keys) {
        const c = compareValues(x[k], y[k], colOf.get(k));
        if (c) return c;
      }
      return 0;
    });

    // Fill empty histogram bins so gaps stay visible on categorical axes (P2.3).
    if (query.bin?.length === 1 && !(query.groupBy?.length) && query.bin[0].fillEmpty !== false) {
      const b = query.bin[0];
      const startKey = binOutput(b);
      const endKey = binEndOutput(b);
      const starts = out.map((r) => num(r[startKey])).filter((v): v is number => v !== null);
      if (starts.length) {
        const min = Math.min(...starts);
        const max = Math.max(...starts);
        const byStart = new Map(out.map((r) => [num(r[startKey]), r]));
        const filled: DataRow[] = [];
        for (let s = min; s <= max + b.step * 1e-9; s = roundBin(s + b.step)) {
          const existing = byStart.get(s) ?? byStart.get(roundBin(s));
          if (existing) {
            filled.push(existing);
          } else {
            const row: DataRow = { [startKey]: s, [endKey]: roundBin(s + b.step) };
            for (const a of query.aggregate ?? []) {
              row[a.as] =
                a.fn === 'count' ||
                a.fn === 'count_distinct' ||
                a.fn === 'count_if' ||
                a.fn === 'sum' ||
                a.fn === 'sum_if' ||
                a.fn === 'share'
                  ? 0
                  : null;
            }
            filled.push(row);
          }
        }
        rows = filled;
      } else {
        rows = out;
      }
    } else {
      rows = out;
    }
  } else {
    rows = [...rows];
  }

  if (query.sample) rows = sampleRows(rows, query.sample.n, query.sample.seed);

  if (query.orderBy?.length) {
    rows = [...rows].sort((x, y) => {
      for (const o of query.orderBy!) {
        const xv = x[o.column];
        const yv = y[o.column];
        if ((xv === null) !== (yv === null)) return xv === null ? 1 : -1;
        const c = compareValues(xv, yv, colOf.get(o.column));
        if (c) return o.direction === 'desc' ? -c : c;
      }
      return 0;
    });
  }

  if (query.limit) rows = rows.slice(0, query.limit);
  return rows;
}
