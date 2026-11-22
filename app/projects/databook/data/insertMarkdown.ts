import type { BookDocument, MarkdownRow, TabSection } from './types';

/** Midpoint (or ±1) order so a new row slots between neighbors. */
export function orderBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 0;
  if (before === undefined) return after! - 1;
  if (after === undefined) return before + 1;
  if (after <= before) return before + 1;
  return (before + after) / 2;
}

export function newUserMarkdownId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `md-user-${rand}`;
}

export function createUserMarkdownRow(opts: {
  order: number;
  body?: string;
  id?: string;
}): MarkdownRow {
  return {
    id: opts.id ?? newUserMarkdownId(),
    type: 'markdown',
    order: opts.order,
    createdBy: 'user',
    body: opts.body ?? '',
  };
}

/**
 * Insert a user markdown row into a tab.
 * `afterRowId`: `null` = start of tab; a row id = after that row; omitted/`'end'` = end.
 */
export function insertMarkdownRow(
  book: BookDocument,
  tabId: string,
  afterRowId: string | null | 'end' = 'end',
  body = '',
): { book: BookDocument; row: MarkdownRow } {
  const tabIndex = book.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex < 0) throw new Error(`insertMarkdownRow: unknown tab "${tabId}"`);

  const tab = book.tabs[tabIndex];
  const sorted = [...tab.rows].sort((a, b) => a.order - b.order);

  let before: number | undefined;
  let after: number | undefined;
  let insertAt = sorted.length;

  if (afterRowId === null) {
    after = sorted[0]?.order;
    insertAt = 0;
  } else if (afterRowId === 'end') {
    before = sorted[sorted.length - 1]?.order;
    insertAt = sorted.length;
  } else {
    const idx = sorted.findIndex((r) => r.id === afterRowId);
    if (idx < 0) throw new Error(`insertMarkdownRow: unknown row "${afterRowId}" in tab "${tabId}"`);
    before = sorted[idx].order;
    after = sorted[idx + 1]?.order;
    insertAt = idx + 1;
  }

  const row = createUserMarkdownRow({ order: orderBetween(before, after), body });
  const rows = [...sorted.slice(0, insertAt), row, ...sorted.slice(insertAt)];
  const nextTab: TabSection = { ...tab, rows };
  const tabs = book.tabs.map((t, i) => (i === tabIndex ? nextTab : t));
  return { book: { ...book, tabs }, row };
}

/** Update body of an existing markdown row (any createdBy). */
export function updateMarkdownBody(
  book: BookDocument,
  tabId: string,
  rowId: string,
  body: string,
): BookDocument {
  const tabs = book.tabs.map((tab) => {
    if (tab.id !== tabId) return tab;
    const rows = tab.rows.map((r) => {
      if (r.id !== rowId || r.type !== 'markdown') return r;
      return { ...r, body };
    });
    return { ...tab, rows };
  });
  return { ...book, tabs };
}

export function removeMarkdownRow(book: BookDocument, tabId: string, rowId: string): BookDocument {
  return removeBookRow(book, tabId, rowId);
}

/** Drop any row by id (markdown, prompt, or chart). */
export function removeBookRow(book: BookDocument, tabId: string, rowId: string): BookDocument {
  const tabs = book.tabs.map((tab) => {
    if (tab.id !== tabId) return tab;
    return { ...tab, rows: tab.rows.filter((r) => r.id !== rowId) };
  });
  return { ...book, tabs };
}
