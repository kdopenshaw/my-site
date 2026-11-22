/**
 * Headless chart query preview — same resolve + runQuery path as ChartSlot.
 * Invoked by `npm run print-block -- <chartId>` (see scripts/print-block.mjs).
 */
import type { BookDocument, ChartBlock, ChartQuery, DataRow, Table, Value } from './types';
import { collectBlocks } from './chartBlocks';
import { resolveChartBlock } from './resolveChartBlock';
import { runQuery } from './runQuery';

export type PrintBlockFormat = 'csv' | 'table';

export type PrintBlockOptions = {
  format?: PrintBlockFormat;
  /** Max data rows to print (header excluded). Default: all. */
  limit?: number;
};

export type PrintBlockResult = {
  chartId: string;
  title: string;
  queryLabel?: string;
  rowCount: number;
  columns: string[];
  rows: DataRow[];
  /** Compact table body for stdout (CSV or aligned text). */
  body: string;
  /** One-line summary for stderr. */
  summary: string;
};

export class PrintBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrintBlockError';
  }
}

export function findChartBlock(book: BookDocument, chartId: string): ChartBlock | undefined {
  return collectBlocks(book).find((b) => b.id === chartId);
}

function cellString(v: Value): string {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return String(v);
    // Compact but stable for agents: trim float noise without scientific for typical values.
    if (Number.isInteger(v)) return String(v);
    const s = v.toPrecision(12).replace(/\.?0+$/, '');
    return s;
  }
  return String(v);
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Compact CSV (RFC-ish): header + rows, no trailing blank line. */
export function formatRowsCsv(rows: DataRow[], columns?: string[]): string {
  const cols =
    columns ??
    (rows.length
      ? Array.from(
          rows.reduce((set, r) => {
            for (const k of Object.keys(r)) set.add(k);
            return set;
          }, new Set<string>()),
        )
      : []);
  const lines = [cols.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(cols.map((c) => csvEscape(cellString(row[c] ?? null))).join(','));
  }
  return lines.join('\n');
}

/** Compact aligned text table (spaces, no box drawing). */
export function formatRowsTable(rows: DataRow[], columns?: string[]): string {
  const cols =
    columns ??
    (rows.length
      ? Array.from(
          rows.reduce((set, r) => {
            for (const k of Object.keys(r)) set.add(k);
            return set;
          }, new Set<string>()),
        )
      : []);
  if (!cols.length) return '(no columns)';
  const stringRows = rows.map((r) => cols.map((c) => cellString(r[c] ?? null)));
  const widths = cols.map((c, i) =>
    Math.max(c.length, ...stringRows.map((cells) => cells[i]?.length ?? 0)),
  );
  const fmt = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i]!)).join('  ');
  const header = fmt(cols);
  const rule = widths.map((w) => '-'.repeat(w)).join('  ');
  return [header, rule, ...stringRows.map(fmt)].join('\n');
}

export function printChartBlock(
  book: BookDocument,
  table: Table,
  chartId: string,
  options: PrintBlockOptions = {},
): PrintBlockResult {
  const raw = findChartBlock(book, chartId);
  if (!raw) {
    const known = collectBlocks(book)
      .map((b) => b.id)
      .sort();
    throw new PrintBlockError(
      `chart "${chartId}" not found. Known ids: ${known.length ? known.join(', ') : '(none)'}`,
    );
  }

  let block: ChartBlock;
  try {
    block = resolveChartBlock(book, raw);
  } catch (err) {
    throw new PrintBlockError(err instanceof Error ? err.message : String(err));
  }

  if (!block.query) {
    throw new PrintBlockError(`chart "${chartId}" has no query after resolve`);
  }

  let rows: DataRow[];
  try {
    rows = runQuery(table, block.query as ChartQuery);
  } catch (err) {
    throw new PrintBlockError(
      `chart "${chartId}" query failed: ${err instanceof Error ? err.message : err}`,
    );
  }

  const limit = options.limit;
  const truncated = typeof limit === 'number' && limit >= 0 ? rows.slice(0, limit) : rows;
  const columns = truncated.length
    ? Array.from(
        truncated.reduce((set, r) => {
          for (const k of Object.keys(r)) set.add(k);
          return set;
        }, new Set<string>()),
      )
    : [];

  const format: PrintBlockFormat = options.format ?? 'csv';
  const body =
    format === 'table' ? formatRowsTable(truncated, columns) : formatRowsCsv(truncated, columns);

  const shown =
    truncated.length === rows.length
      ? `${rows.length} rows`
      : `${truncated.length}/${rows.length} rows`;
  const label = block.query.label ? ` · ${block.query.label}` : '';
  const summary = `${block.id}  ${block.title}${label}  ${shown}`;

  return {
    chartId: block.id,
    title: block.title,
    queryLabel: block.query.label,
    rowCount: rows.length,
    columns,
    rows: truncated,
    body,
    summary,
  };
}
