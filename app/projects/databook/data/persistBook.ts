import type { BookDocument } from './types';
import { clearFullBookOverlay, saveFullBookOverlay } from './bookOverlay';
import { clearUserRowsOverlay } from './userBookStore';

export const bookEditsAreTemporary = process.env.NODE_ENV !== 'development';

const PERSIST_PATH = '/api/projects/databook';

export type PersistResult = {
  ok: boolean;
  via: 'disk' | 'local' | 'none';
  error?: string;
};

async function persistToDisk(book: BookDocument): Promise<PersistResult> {
  try {
    const res = await fetch(PERSIST_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, via: 'none', error: body?.error ?? res.statusText };
    }
    clearUserRowsOverlay(book);
    clearFullBookOverlay(book);
    return { ok: true, via: 'disk' };
  } catch (err) {
    return { ok: false, via: 'none', error: err instanceof Error ? err.message : String(err) };
  }
}

/** Write book to disk (dev) or localStorage full-book overlay (preview). */
export async function flushPersistBook(book: BookDocument): Promise<PersistResult> {
  if (bookEditsAreTemporary) return { ok: true, via: 'none' };
  const disk = await persistToDisk(book);
  if (disk.ok) return disk;
  if (typeof window !== 'undefined') {
    saveFullBookOverlay(book);
    return { ok: true, via: 'local' };
  }
  return disk;
}

let pending: BookDocument | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<PersistResult> = Promise.resolve({ ok: true, via: 'none' });

/** Debounced, serialized persist queue. */
export function schedulePersistBook(book: BookDocument): Promise<PersistResult> {
  pending = book;
  if (debounceTimer) clearTimeout(debounceTimer);
  const scheduled = new Promise<PersistResult>((resolve) => {
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const toWrite = pending;
      pending = null;
      if (!toWrite) {
        resolve({ ok: true, via: 'none' });
        return;
      }
      chain = chain
        .then(() => flushPersistBook(toWrite))
        .then((r) => {
          resolve(r);
          return r;
        });
    }, 350);
  });
  return scheduled;
}

/** @deprecated use schedulePersistBook */
export async function persistBookToSource(book: BookDocument): Promise<boolean> {
  const r = await flushPersistBook(book);
  return r.ok;
}
