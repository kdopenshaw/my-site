import type { BookDocument, BookPage, TabSection } from './types';

export function tabsForPage(book: BookDocument, pageId: string): TabSection[] {
  const page = book.pages?.find((p) => p.id === pageId);
  if (!page) return [];
  const byId = new Map(book.tabs.map((t) => [t.id, t]));
  return page.tabIds.map((id) => byId.get(id)).filter((t): t is TabSection => Boolean(t));
}

export function pageForTab(pages: BookPage[], tabId: string): BookPage | undefined {
  return pages.find((p) => p.tabIds.includes(tabId));
}

export function pickTabForPage(pageTabIds: string[], preferred?: string): string | undefined {
  if (preferred && pageTabIds.includes(preferred)) return preferred;
  return pageTabIds[0];
}

export function pickTabOnPageAfterDelete(pageTabIds: string[], deletedId: string): string | undefined {
  return pageTabIds.find((id) => id !== deletedId);
}

export function adjacentPageAfterDelete(pages: BookPage[], deletedPageId: string): BookPage | undefined {
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((p) => p.id === deletedPageId);
  if (idx < 0) return sorted[0];
  return sorted[idx + 1] ?? sorted[idx - 1];
}

export function validateTabId(book: BookDocument, tabId: string): string | undefined {
  return book.tabs.some((t) => t.id === tabId) ? tabId : book.tabs[0]?.id;
}

export function validatePageId(book: BookDocument, pageId: string): string | undefined {
  const pages = book.pages ?? [];
  if (!pages.length) return undefined;
  return pages.some((p) => p.id === pageId) ? pageId : pages[0]?.id;
}

export function syncTabToPage(
  pages: BookPage[],
  activePageId: string,
  activeTabId: string,
): { pageId: string; tabId: string } {
  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  if (!page) return { pageId: '', tabId: activeTabId };
  const tabId = page.tabIds.includes(activeTabId) ? activeTabId : page.tabIds[0] ?? activeTabId;
  return { pageId: page.id, tabId };
}
