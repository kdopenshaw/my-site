import type { BookDocument, BookRow, TabSection } from './types';

/**
 * Preserve human-inserted (`createdBy: "user"`) rows when regenerating a book.
 *
 * Semantics:
 * - Every row with `createdBy: "user"` in `previous` is kept verbatim.
 * - It is re-inserted into the same tab id at its `order` (fractional orders OK).
 * - If that tab no longer exists, throw — do not silently drop user work.
 * - Skill rows from `next` win for the same `id`; user rows keep their ids.
 */
export function mergeUserRows(previous: BookDocument | null | undefined, next: BookDocument): BookDocument {
  if (!previous) return next;

  const userByTab = new Map<string, BookRow[]>();
  for (const tab of previous.tabs) {
    const users = tab.rows.filter((r) => r.createdBy === 'user');
    if (users.length) userByTab.set(tab.id, users);
  }

  if (!userByTab.size) return next;

  const nextTabIds = new Set(next.tabs.map((t) => t.id));
  for (const tabId of userByTab.keys()) {
    if (!nextTabIds.has(tabId)) {
      throw new Error(
        `mergeUserRows: tab "${tabId}" had createdBy:user rows but is missing from the regenerated book. Restore the tab or move the user rows first.`,
      );
    }
  }

  const tabs: TabSection[] = next.tabs.map((tab) => {
    const users = userByTab.get(tab.id);
    if (!users?.length) return tab;
    const skillIds = new Set(tab.rows.map((r) => r.id));
    const collisions = users.filter((u) => skillIds.has(u.id));
    if (collisions.length) {
      throw new Error(
        `mergeUserRows: user row id(s) collide with skill rows in tab "${tab.id}": ${collisions.map((c) => c.id).join(', ')}`,
      );
    }
    const rows = [...tab.rows, ...users].sort((a, b) => a.order - b.order);
    return { ...tab, rows };
  });

  return { ...next, tabs };
}
