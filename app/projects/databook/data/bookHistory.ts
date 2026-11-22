import type { BookDocument } from './types';

export type BookHistory = {
  past: BookDocument[];
  future: BookDocument[];
};

const LIMIT = 80;

export function cloneBook(book: BookDocument): BookDocument {
  return structuredClone(book);
}

export function booksEqual(a: BookDocument, b: BookDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function emptyBookHistory(): BookHistory {
  return { past: [], future: [] };
}

export function recordBookChange(history: BookHistory, current: BookDocument, next: BookDocument): BookHistory {
  if (booksEqual(current, next)) return history;
  const past = [...history.past, cloneBook(current)];
  if (past.length > LIMIT) past.shift();
  return { past, future: [] };
}

export function undoBook(history: BookHistory, current: BookDocument): {
  history: BookHistory;
  book: BookDocument;
} | null {
  if (!history.past.length) return null;
  const past = history.past.slice(0, -1);
  const book = history.past[history.past.length - 1];
  return {
    book,
    history: { past, future: [...history.future, cloneBook(current)] },
  };
}

export function redoBook(history: BookHistory, current: BookDocument): {
  history: BookHistory;
  book: BookDocument;
} | null {
  if (!history.future.length) return null;
  const book = history.future[history.future.length - 1];
  const future = history.future.slice(0, -1);
  return {
    book,
    history: { past: [...history.past, cloneBook(current)], future },
  };
}

export function isUndoKey(e: { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  if (e.altKey || !(e.metaKey || e.ctrlKey)) return false;
  return e.key.toLowerCase() === 'z' && !e.shiftKey;
}

export function isRedoKey(e: { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  if (e.altKey || !(e.metaKey || e.ctrlKey)) return false;
  if (e.key.toLowerCase() === 'y' && !e.shiftKey) return true;
  return e.key.toLowerCase() === 'z' && e.shiftKey;
}
