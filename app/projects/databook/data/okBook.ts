/**
 * Lightweight gate: query nonempty smoke (no chart-type catalog lint).
 * Invoked by `npm run ok` (see scripts/ok-book.mjs).
 */
import type { BookDocument, ChartBlock, ChartQuery, Table } from './types';
import { resolveChartBlock } from './resolveChartBlock';
import { runQuery } from './runQuery';

export type OkIssue = {
  level: 'error' | 'warning';
  code: string;
  message: string;
  chartId?: string;
  tabId?: string;
};

export type OkResult = {
  ok: boolean;
  issues: OkIssue[];
};

/** Opt-in: chart may return zero rows without failing query smoke. */
export function allowsEmptyQuery(block: ChartBlock): boolean {
  const notes = `${block.subtitle ?? ''} ${block.notes ?? ''}`.toLowerCase();
  return (
    (block as ChartBlock & { allowEmpty?: boolean }).allowEmpty === true ||
    /\ballow(?:s|ed)?\s+empty\b/.test(notes) ||
    /\bempty\s+ok\b/.test(notes)
  );
}

function collectComponentBlocks(book: BookDocument): Array<{ tabId: string; block: ChartBlock }> {
  const out: Array<{ tabId: string; block: ChartBlock }> = [];
  for (const tab of book.tabs) {
    for (const row of tab.rows) {
      if (row.type !== 'component') continue;
      for (const block of row.components) out.push({ tabId: tab.id, block });
    }
  }
  return out;
}

export function smokeQueries(book: BookDocument, table: Table): OkIssue[] {
  const issues: OkIssue[] = [];
  for (const { tabId, block: raw } of collectComponentBlocks(book)) {
    let block: ChartBlock;
    try {
      block = resolveChartBlock(book, raw);
    } catch (err) {
      issues.push({
        level: 'error',
        code: 'resolve-failed',
        message: err instanceof Error ? err.message : String(err),
        chartId: raw.id,
        tabId,
      });
      continue;
    }
    if (!block.query) {
      issues.push({
        level: 'error',
        code: 'missing-query',
        message: `chart "${block.id}" has no query after resolve`,
        chartId: block.id,
        tabId,
      });
      continue;
    }
    if (allowsEmptyQuery(block)) continue;

    let rows;
    try {
      rows = runQuery(table, block.query as ChartQuery);
    } catch (err) {
      issues.push({
        level: 'error',
        code: 'query-failed',
        message: `chart "${block.id}" query threw: ${err instanceof Error ? err.message : err}`,
        chartId: block.id,
        tabId,
      });
      continue;
    }
    if (!rows.length) {
      issues.push({
        level: 'error',
        code: 'query-empty',
        message: `chart "${block.id}" query returned 0 rows (set allowEmpty or note "empty ok" if intentional)`,
        chartId: block.id,
        tabId,
      });
    }
  }
  return issues;
}

/** Nonempty query smoke against canonical table. */
export function checkLiveBook(book: BookDocument, table: Table): OkResult {
  const issues = smokeQueries(book, table);
  return { ok: issues.every((i) => i.level !== 'error'), issues };
}

export function formatOkIssues(issues: OkIssue[]): string {
  if (!issues.length) return '';
  return issues
    .map((i) => {
      const where = [i.tabId, i.chartId].filter(Boolean).join('/');
      const prefix = where ? `${where}: ` : '';
      return `- [${i.level}] ${i.code} ${prefix}${i.message}`;
    })
    .join('\n');
}
