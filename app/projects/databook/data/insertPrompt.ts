import { orderBetween } from './insertMarkdown';
import type { BookDocument, PromptRow, TabSection } from './types';

export function newUserPromptId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `prompt-user-${rand}`;
}

export function createUserPromptRow(opts: {
  order: number;
  prompt?: string;
  id?: string;
}): PromptRow {
  return {
    id: opts.id ?? newUserPromptId(),
    type: 'prompt',
    order: opts.order,
    createdBy: 'user',
    prompt: opts.prompt ?? '',
    status: 'draft',
    model: 'gpt-6-astra',
    effort: 'medium',
  };
}

/**
 * Insert a Codex prompt row into a tab.
 * `afterRowId`: `null` = start; a row id = after that row; omitted/`'end'` = end.
 */
export function insertPromptRow(
  book: BookDocument,
  tabId: string,
  afterRowId: string | null | 'end' = 'end',
  prompt = '',
): { book: BookDocument; row: PromptRow } {
  const tabIndex = book.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex < 0) throw new Error(`insertPromptRow: unknown tab "${tabId}"`);

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
    if (idx < 0) throw new Error(`insertPromptRow: unknown row "${afterRowId}" in tab "${tabId}"`);
    before = sorted[idx].order;
    after = sorted[idx + 1]?.order;
    insertAt = idx + 1;
  }

  const row = createUserPromptRow({ order: orderBetween(before, after), prompt });
  const rows = [...sorted.slice(0, insertAt), row, ...sorted.slice(insertAt)];
  const nextTab: TabSection = { ...tab, rows };
  const tabs = book.tabs.map((t, i) => (i === tabIndex ? nextTab : t));
  return { book: { ...book, tabs }, row };
}

export function updatePromptRow(
  book: BookDocument,
  tabId: string,
  rowId: string,
  patch: Partial<Omit<PromptRow, 'id' | 'type' | 'createdBy'>>,
): BookDocument {
  const tabs = book.tabs.map((tab) => {
    if (tab.id !== tabId) return tab;
    const rows = tab.rows.map((r) => {
      if (r.id !== rowId || r.type !== 'prompt') return r;
      return { ...r, ...patch };
    });
    return { ...tab, rows };
  });
  return { ...book, tabs };
}
