import type { AggSpec, BinSpec, ChartQuery, ColumnSpec, ColumnType } from './types';

const ORDERED: ColumnType[] = ['quantitative', 'temporal'];
const NUMERIC_AGG: ColumnType[] = ['quantitative', 'boolean'];

export const binOutput = (b: BinSpec) => b.as ?? `${b.column}_bin`;
export const binEndOutput = (b: BinSpec) => `${binOutput(b)}_end`;

export const isAggregated = (q: ChartQuery) => Boolean(q.aggregate?.length || q.groupBy?.length || q.bin?.length);

const columnLabel = (c: ColumnSpec) => c.label ?? c.name;

const AGG_LABEL: Record<AggSpec['fn'], string> = {
  count: 'Count',
  count_distinct: 'Distinct',
  sum: 'Total',
  mean: 'Mean',
  median: 'Median',
  min: 'Min',
  max: 'Max',
  ratio: 'Ratio',
  share: 'Share',
  count_if: 'Count if',
  sum_if: 'Sum if',
  mean_if: 'Mean if',
};

/** Static checks on a query object against the canonical column contract. */
export function validateQuery(query: ChartQuery, schema: ColumnSpec[]): string[] {
  const errors: string[] = [];
  const cols = new Map(schema.map((c) => [c.name, c]));
  const col = (name: string | undefined, where: string) => {
    if (!name) {
      errors.push(`${where}: column is required`);
      return undefined;
    }
    const c = cols.get(name);
    if (!c) errors.push(`${where}: unknown column "${name}"`);
    return c;
  };

  for (const [i, f] of (query.filter ?? []).entries()) {
    const c = col(f.column, `filter[${i}]`);
    if (!c) continue;
    if (['gt', 'gte', 'lt', 'lte'].includes(f.op) && !ORDERED.includes(c.type))
      errors.push(`filter[${i}]: "${f.op}" needs a quantitative or temporal column, "${c.name}" is ${c.type}`);
    if (['in', 'not_in'].includes(f.op) && !Array.isArray(f.value)) errors.push(`filter[${i}]: "${f.op}" needs an array value`);
    if (['eq', 'neq', 'gt', 'gte', 'lt', 'lte'].includes(f.op) && (f.value === undefined || Array.isArray(f.value)))
      errors.push(`filter[${i}]: "${f.op}" needs a single value`);
  }

  for (const [i, g] of (query.groupBy ?? []).entries()) col(g, `groupBy[${i}]`);

  for (const [i, b] of (query.bin ?? []).entries()) {
    const c = col(b.column, `bin[${i}]`);
    if (c && c.type !== 'quantitative') errors.push(`bin[${i}]: "${c.name}" must be quantitative to bin`);
    if (!(b.step > 0)) errors.push(`bin[${i}]: step must be > 0`);
    if (c?.nullable && !query.filter?.some((f) => f.column === c.name && f.op === 'not_null'))
      errors.push(`bin[${i}]: "${c.name}" is nullable; add a not_null filter so dropped nulls are explicit`);
  }

  for (const [i, a] of (query.aggregate ?? []).entries()) {
    const where = `aggregate[${i}] (${a.as})`;
    if (!a.as) errors.push(`aggregate[${i}]: "as" is required`);
    if (a.where) {
      const wc = col(a.where.column, `${where} where`);
      if (wc && ['gt', 'gte', 'lt', 'lte'].includes(a.where.op) && !ORDERED.includes(wc.type))
        errors.push(`${where} where: "${a.where.op}" needs a quantitative or temporal column`);
    }
    if (a.fn === 'count') {
      if (a.column) col(a.column, where);
      continue;
    }
    if (a.fn === 'count_if') {
      if (!a.where) errors.push(`${where}: count_if requires "where"`);
      continue;
    }
    if (a.fn === 'share') {
      if (!a.where && !a.column) errors.push(`${where}: share needs "where" or a boolean/rate "column"`);
      if (a.column && !a.where) col(a.column, where);
      continue;
    }
    if (a.fn === 'sum_if' || a.fn === 'mean_if') {
      if (!a.where) errors.push(`${where}: ${a.fn} requires "where"`);
      const c = col(a.column, where);
      if (c && !NUMERIC_AGG.includes(c.type))
        errors.push(`${where}: ${a.fn} needs a quantitative or boolean column, "${c.name}" is ${c.type}`);
      continue;
    }
    const c = col(a.column, where);
    if (!c) continue;
    if (['sum', 'mean', 'median'].includes(a.fn) && !NUMERIC_AGG.includes(c.type))
      errors.push(`${where}: ${a.fn} needs a quantitative or boolean column, "${c.name}" is ${c.type}`);
    if (['min', 'max'].includes(a.fn) && !ORDERED.includes(c.type))
      errors.push(`${where}: ${a.fn} needs a quantitative or temporal column, "${c.name}" is ${c.type}`);
    if (a.fn === 'ratio') {
      if (c.type !== 'quantitative') errors.push(`${where}: ratio numerator "${c.name}" must be quantitative`);
      const d = col(a.denominator, `${where} denominator`);
      if (d && d.type !== 'quantitative') errors.push(`${where}: ratio denominator "${d.name}" must be quantitative`);
    }
  }

  if ((query.groupBy?.length || query.bin?.length) && !query.aggregate?.length)
    errors.push('groupBy/bin requires at least one aggregate (no plotting raw duplicated keys as if aggregated)');

  const outputs = isAggregated(query)
    ? [...(query.groupBy ?? []), ...(query.bin ?? []).flatMap((b) => [binOutput(b), binEndOutput(b)]), ...(query.aggregate ?? []).map((a) => a.as)]
    : schema.map((c) => c.name);
  const seen = new Set<string>();
  for (const o of outputs) {
    if (seen.has(o)) errors.push(`duplicate output column "${o}"`);
    seen.add(o);
  }

  for (const [i, o] of (query.orderBy ?? []).entries())
    if (!seen.has(o.column)) errors.push(`orderBy[${i}]: "${o.column}" is not an output column of this query`);
  if (query.limit !== undefined && !(Number.isInteger(query.limit) && query.limit > 0)) errors.push('limit must be a positive integer');
  if (query.sample && !(Number.isInteger(query.sample.n) && query.sample.n > 0)) errors.push('sample.n must be a positive integer');

  return errors;
}

/** Column contract of a query's result rows. */
export function inferResultSchema(query: ChartQuery, schema: ColumnSpec[]): ColumnSpec[] {
  if (!isAggregated(query)) return schema;
  const cols = new Map(schema.map((c) => [c.name, c]));
  const out: ColumnSpec[] = [];
  for (const g of query.groupBy ?? []) {
    const c = cols.get(g);
    if (c) out.push(c);
  }
  for (const b of query.bin ?? []) {
    const c = cols.get(b.column);
    const base = { type: 'quantitative' as const, unit: c?.unit, label: c ? columnLabel(c) : b.column };
    out.push({ ...base, name: binOutput(b), binned: { step: b.step, endColumn: binEndOutput(b) } });
    out.push({ ...base, name: binEndOutput(b) });
  }
  for (const a of query.aggregate ?? []) {
    const c = a.column ? cols.get(a.column) : undefined;
    let type: ColumnType = 'quantitative';
    let unit = c?.unit;
    if (a.fn === 'count' || a.fn === 'count_distinct' || a.fn === 'count_if') unit = 'count';
    if (a.fn === 'ratio' || a.fn === 'share') unit = 'ratio';
    if ((a.fn === 'mean' || a.fn === 'mean_if') && c?.type === 'boolean') unit = 'ratio';
    if (a.fn === 'sum_if') unit = c?.unit;
    if ((a.fn === 'min' || a.fn === 'max') && c?.type === 'temporal') type = 'temporal';
    const label = a.label ?? (a.fn === 'count' && !c ? 'Rows' : `${AGG_LABEL[a.fn]} ${c ? columnLabel(c).toLowerCase() : ''}`.trim());
    out.push({ name: a.as, type, unit: a.unit ?? unit, label });
  }
  return out;
}
