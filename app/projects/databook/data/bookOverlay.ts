import type { BookDocument } from './types';
import { defaultKvStore, type KvStore } from './userBookStore';

const PREFIX = 'databook:full-book:v1:';

export function fullBookStorageKey(book: BookDocument): string {
  return `${PREFIX}${book.experimentId || book.title || 'book'}`;
}

type StoredFullBook = { version: 1; book: BookDocument };

export function saveFullBookOverlay(book: BookDocument, store: KvStore = defaultKvStore()): void {
  const payload: StoredFullBook = { version: 1, book };
  store.setItem(fullBookStorageKey(book), JSON.stringify(payload));
}

export function clearFullBookOverlay(book: BookDocument, store: KvStore = defaultKvStore()): void {
  store.removeItem?.(fullBookStorageKey(book));
}

export function loadFullBookOverlay(
  base: BookDocument,
  store: KvStore = defaultKvStore(),
): BookDocument | null {
  const raw = store.getItem(fullBookStorageKey(base));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredFullBook;
    if (parsed?.version === 1 && parsed.book?.tabs) return parsed.book;
  } catch {
    return null;
  }
  return null;
}
