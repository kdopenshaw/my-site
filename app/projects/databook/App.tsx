const supportsLocalAgent = false;
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeKey } from './components/charts/ResponsiveFrame';
import { ConfirmDialog } from './components/layout/ConfirmDialog';
import { PageLayout } from './components/layout/PageLayout';
import { PersistBanner } from './components/layout/PersistBanner';
import { RowRenderer } from './components/rows/RowRenderer';
import {
  addPage,
  addTab,
  deletePage,
  deleteTab,
  ensureDefaultPage,
  normalizePageTabIds,
  renameBookTitle,
  renamePage,
  renameTab,
  reorderRowsBefore,
} from './data/bookEdits';
import { loadBookForApp } from './data/loadBookForApp';
import {
  insertMarkdownRow,
  removeBookRow,
  removeMarkdownRow,
  updateMarkdownBody,
} from './data/insertMarkdown';
import { insertPromptRow, updatePromptRow } from './data/insertPrompt';
import type { BookDocument, PromptRow as PromptRowModel } from './data/types';
import { loadCanonical } from './data/loadCanonical';
import {
  adjacentPageAfterDelete,
  pageForTab,
  pickTabForPage,
  pickTabOnPageAfterDelete,
  syncTabToPage,
  tabsForPage,
  validatePageId,
  validateTabId,
} from './data/navBook';
import {
  emptyBookHistory,
  isRedoKey,
  isUndoKey,
  recordBookChange,
  redoBook,
  undoBook,
} from './data/bookHistory';
import type { PersistResult } from './data/persistBook';
import { bookEditsAreTemporary, flushPersistBook, schedulePersistBook } from './data/persistBook';
import rowsJson from './data/rows.json';

function readTabFromUrl(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const q = new URLSearchParams(window.location.search).get('tab');
  if (q) return q;
  const fromHash = window.location.hash.replace(/^#/, '');
  return fromHash || fallback;
}

function readPageFromUrl(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get('page') || fallback;
}

function writeNavToUrl(tabId: string, pageId?: string, replace = true) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tabId);
  if (pageId) url.searchParams.set('page', pageId);
  else url.searchParams.delete('page');
  url.hash = '';
  const next = url.pathname + url.search;
  const cur = window.location.pathname + window.location.search;
  if (next === cur) return;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', next);
}

type ConfirmState = {
  title: string;
  message: string;
  onResolve: (ok: boolean) => void;
};

export default function App() {
  const baseBook = rowsJson as BookDocument;
  const [book, setBook] = useState<BookDocument>(() => loadBookForApp(baseBook));
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [lastPersist, setLastPersist] = useState<PersistResult | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptModels, setPromptModels] = useState<Array<{ slug: string; displayName: string }>>([]);
  const userNavRef = useRef(false);
  const bookRef = useRef(book);
  const historyRef = useRef(emptyBookHistory());
  bookRef.current = book;
  const table = useMemo(() => loadCanonical(), []);
  const allTabs = useMemo(() => [...book.tabs].sort((a, b) => a.order - b.order), [book.tabs]);
  const pages = useMemo(() => [...(book.pages ?? [])].sort((a, b) => a.order - b.order), [book.pages]);
  const defaultId = book.defaultTabId ?? allTabs[0]?.id ?? '';

  const [activeTabId, setActiveTabId] = useState(() =>
    validateTabId(loadBookForApp(baseBook), readTabFromUrl(defaultId)) ?? defaultId,
  );
  const [activePageId, setActivePageId] = useState(() => {
    const loaded = loadBookForApp(baseBook);
    const pgs = loaded.pages ?? [];
    const fromUrl = validatePageId(loaded, readPageFromUrl('')) ?? '';
    if (fromUrl) return fromUrl;
    const tab = validateTabId(loaded, readTabFromUrl(defaultId)) ?? defaultId;
    return pageForTab(pgs, tab)?.id ?? pgs[0]?.id ?? '';
  });

  const themeKey = useThemeKey();
  const previewMode = bookEditsAreTemporary;

  const applyBook = useCallback((next: BookDocument, opts?: { persist?: boolean; record?: boolean }) => {
    const current = bookRef.current;
    const normalized = ensureDefaultPage(normalizePageTabIds(next));
    if (opts?.record !== false) {
      historyRef.current = recordBookChange(historyRef.current, current, normalized);
    }
    bookRef.current = normalized;
    setBook(normalized);
    if (!bookEditsAreTemporary && opts?.persist !== false) {
      void schedulePersistBook(normalized).then((r) => {
        setLastPersist(r);
        setPersistError(r.ok ? null : r.error ?? 'Save failed');
      });
    }
    return normalized;
  }, []);

  const undoEdit = useCallback(() => {
    const result = undoBook(historyRef.current, bookRef.current);
    if (!result) return;
    historyRef.current = result.history;
    applyBook(result.book, { record: false });
  }, [applyBook]);

  const redoEdit = useCallback(() => {
    const result = redoBook(historyRef.current, bookRef.current);
    if (!result) return;
    historyRef.current = result.history;
    applyBook(result.book, { record: false });
  }, [applyBook]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea')) return;
      if (isUndoKey(e)) {
        e.preventDefault();
        undoEdit();
        return;
      }
      if (isRedoKey(e)) {
        e.preventDefault();
        redoEdit();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [redoEdit, undoEdit]);

  const tabs = useMemo(
    () => (pages.length ? tabsForPage(book, activePageId) : allTabs),
    [allTabs, book, pages.length, activePageId],
  );

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const requestConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ title, message, onResolve: resolve });
    });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = book.title || 'DataBook';
  }, [book.title]);

  useEffect(() => {
    if (!pages.length) return;
    const synced = syncTabToPage(pages, activePageId, activeTabId);
    if (synced.pageId !== activePageId) setActivePageId(synced.pageId);
    if (synced.tabId !== activeTabId) setActiveTabId(synced.tabId);
  }, [pages, activePageId, activeTabId]);

  useEffect(() => {
    writeNavToUrl(activeTabId, pages.length ? activePageId : undefined, !userNavRef.current);
    userNavRef.current = false;
  }, [activeTabId, activePageId, pages.length]);

  useEffect(() => {
    const onPop = () => {
      const tab = validateTabId(book, readTabFromUrl(defaultId)) ?? defaultId;
      setActiveTabId(tab);
      if (pages.length) {
        const page = validatePageId(book, readPageFromUrl(pages[0]?.id ?? '')) ?? pages[0]?.id;
        if (page) setActivePageId(page);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [book, defaultId, pages]);

  useEffect(() => {
    if (!supportsLocalAgent) return;
    if (baseBook.pages?.length) return;
    const initial = loadBookForApp(baseBook);
    if (initial.pages?.length) void flushPersistBook(initial);
  }, [baseBook]);

  const selectTab = (tabId: string) => {
    userNavRef.current = true;
    setActiveTabId(tabId);
    const page = pageForTab(pages, tabId);
    if (page) setActivePageId(page.id);
    writeNavToUrl(tabId, page?.id ?? activePageId, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectPage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    userNavRef.current = true;
    setActivePageId(pageId);
    const nextTab = pickTabForPage(page.tabIds, activeTabId);
    if (nextTab) setActiveTabId(nextTab);
    writeNavToUrl(nextTab ?? activeTabId, pageId, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!supportsLocalAgent) return;
    void fetch('/api/codex/models')
      .then((r) => r.json())
      .then((body: { models?: Array<{ slug: string; displayName: string }> }) => {
        if (Array.isArray(body.models)) setPromptModels(body.models);
      })
      .catch(() => undefined);
  }, []);

  const insertMarkdown = (afterRowId: string | null) => {
    if (!activeTab) return;
    const { book: next, row } = insertMarkdownRow(book, activeTab.id, afterRowId, '');
    applyBook(next, { persist: false });
    setEditingRowId(row.id);
  };

  const saveMarkdown = (rowId: string, body: string) => {
    if (!activeTab) return;
    applyBook(updateMarkdownBody(book, activeTab.id, rowId, body));
  };

  const finishMarkdown = () => {
    setEditingRowId(null);
  };

  const cancelMarkdown = (rowId: string, originalBody: string) => {
    if (!activeTab) return;
    if (!originalBody.trim()) {
      applyBook(removeMarkdownRow(book, activeTab.id, rowId));
    } else {
      applyBook(updateMarkdownBody(book, activeTab.id, rowId, originalBody));
    }
    setEditingRowId(null);
  };

  const handleAddTab = () => {
    const pageId = pages.length ? activePageId : undefined;
    const { book: next, tab } = addTab(book, { pageId });
    applyBook(next);
    userNavRef.current = true;
    setActiveTabId(tab.id);
  };

  const handleAddPage = () => {
    const { book: next, page } = addPage(book);
    applyBook(next);
    userNavRef.current = true;
    setActivePageId(page.id);
    setActiveTabId(page.tabIds[0] ?? next.defaultTabId ?? '');
  };

  const handleRenameTitle = (title: string) => {
    applyBook(renameBookTitle(book, title));
  };

  const handleRenameTab = (tabId: string, label: string) => {
    applyBook(renameTab(book, tabId, label));
  };

  const handleRenamePage = (pageId: string, label: string) => {
    applyBook(renamePage(book, pageId, label));
  };

  const handleReorderRows = (movedId: string, beforeId: string) => {
    if (!activeTab) return;
    applyBook(reorderRowsBefore(book, activeTab.id, movedId, beforeId));
  };

  const insertPrompt = (afterRowId: string | null) => {
    if (!activeTab) return;
    const { book: next } = insertPromptRow(book, activeTab.id, afterRowId, '');
    applyBook(next, { persist: false });
  };

  const changePrompt = (rowId: string, patch: Partial<PromptRowModel>) => {
    if (!activeTab) return;
    applyBook(updatePromptRow(book, activeTab.id, rowId, patch), { persist: false, record: false });
  };

  const sendPrompt = async (rowId: string) => {
    if (!activeTab) return;
    const row = activeTab.rows.find((r) => r.id === rowId && r.type === 'prompt');
    if (!row || row.type !== 'prompt') return;
    const startedAt = new Date().toISOString();
    applyBook(
      updatePromptRow(book, activeTab.id, rowId, {
        status: 'running',
        startedAt,
        finishedAt: undefined,
        error: undefined,
        lastMessage: undefined,
      }),
      { persist: false },
    );
    try {
      const res = await fetch('/api/codex/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: row.prompt,
          model: row.model,
          effort: row.effort,
          tabId: activeTab.id,
          rowId,
        }),
      });
      const body = (await res.json()) as {
        id?: string;
        error?: string;
        sessionId?: string;
        status?: PromptRowModel['status'];
        lastMessage?: string;
      };
      if (!res.ok || !body.id) {
        applyBook(
          updatePromptRow(bookRef.current, activeTab.id, rowId, {
            status: 'error',
            error: body.error ?? 'Failed to start Codex',
            finishedAt: new Date().toISOString(),
          }),
        );
        return;
      }
      applyBook(
        updatePromptRow(bookRef.current, activeTab.id, rowId, {
          jobId: body.id,
          sessionId: body.sessionId,
          status: body.status ?? 'running',
          lastMessage: body.lastMessage,
        }),
        { persist: false },
      );
    } catch (err) {
      applyBook(
        updatePromptRow(bookRef.current, activeTab.id, rowId, {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          finishedAt: new Date().toISOString(),
        }),
      );
    }
  };

  const openPromptSession = async (rowId: string) => {
    if (!activeTab) return;
    const row = activeTab.rows.find((r) => r.id === rowId && r.type === 'prompt');
    if (!row || row.type !== 'prompt' || !row.jobId) return;
    await fetch(`/api/codex/jobs/${row.jobId}/open`, { method: 'POST' });
  };

  const promptJobKey = book.tabs
    .flatMap((t) => t.rows)
    .filter(
      (r): r is PromptRowModel =>
        r.type === 'prompt' && Boolean(r.jobId) && (r.status === 'running' || r.status === 'needs_input'),
    )
    .map((r) => r.jobId)
    .join(',');

  useEffect(() => {
    if (!supportsLocalAgent || !promptJobKey) return;
    const tick = async () => {
      for (const jobId of promptJobKey.split(',')) {
        try {
          const res = await fetch(`/api/codex/jobs/${jobId}`);
          if (!res.ok) continue;
          const body = (await res.json()) as {
            status?: PromptRowModel['status'];
            sessionId?: string;
            lastMessage?: string;
            error?: string;
            finishedAt?: string;
          };
          const tab = bookRef.current.tabs.find((t) =>
            t.rows.some((r) => r.type === 'prompt' && r.jobId === jobId),
          );
          const row = tab?.rows.find((r) => r.type === 'prompt' && r.jobId === jobId);
          if (!tab || !row || row.type !== 'prompt') continue;
          if (
            row.status === body.status &&
            row.sessionId === body.sessionId &&
            row.lastMessage === body.lastMessage &&
            row.error === body.error
          ) {
            continue;
          }
          const terminal = body.status === 'done' || body.status === 'error';
          applyBook(
            updatePromptRow(bookRef.current, tab.id, row.id, {
              status: body.status ?? row.status,
              sessionId: body.sessionId ?? row.sessionId,
              lastMessage: body.lastMessage,
              error: body.error,
              finishedAt: body.finishedAt,
            }),
            { persist: terminal, record: terminal },
          );
        } catch {
          /* keep last known */
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => window.clearInterval(id);
  }, [applyBook, promptJobKey]);

  const handleDeleteRow = (rowId: string) => {
    if (!activeTab) return;
    applyBook(removeBookRow(book, activeTab.id, rowId));
  };

  const handleDeleteTab = async (tabId: string) => {
    const tab = book.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const ok = await requestConfirm(
      'Delete tab',
      `Delete tab “${tab.label}” and all blocks in it?`,
    );
    if (!ok) return;
    const pageTabs = pages.length
      ? (pages.find((p) => p.id === activePageId)?.tabIds ?? [])
      : allTabs.map((t) => t.id);
    const fallback = pickTabOnPageAfterDelete(pageTabs, tabId);
    applyBook(deleteTab(book, tabId));
    if (fallback) setActiveTabId(fallback);
  };

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const tabCount = page.tabIds.length;
    const ok = await requestConfirm(
      'Delete page',
      `Delete page “${page.label}” and ${tabCount} tab${tabCount === 1 ? '' : 's'} on it (all rows inside)?`,
    );
    if (!ok) return;
    const neighbor = adjacentPageAfterDelete(pages, pageId);
    const next = deletePage(book, pageId);
    applyBook(next);
    if (neighbor) {
      setActivePageId(neighbor.id);
      setActiveTabId(neighbor.tabIds[0] ?? next.defaultTabId ?? '');
    } else if (next.tabs[0]) {
      setActiveTabId(next.tabs[0].id);
    }
  };

  return (
    <>
      <PageLayout
        title={book.title}
        onRenameTitle={handleRenameTitle}
        tabs={tabs}
        activeTabId={activeTab?.id ?? ''}
        onSelectTab={selectTab}
        onAddTab={handleAddTab}
        onRenameTab={handleRenameTab}
        onDeleteTab={handleDeleteTab}
        pages={pages}
        activePageId={activePageId}
        onSelectPage={selectPage}
        onAddPage={handleAddPage}
        onRenamePage={handleRenamePage}
        onDeletePage={handleDeletePage}
        banner={
          <PersistBanner last={lastPersist} error={persistError} previewMode={previewMode} />
        }
      >
        {activeTab ? (
          <RowRenderer
            key={themeKey}
            rows={activeTab.rows}
            table={table}
            book={book}
            onInsertMarkdown={insertMarkdown}
            onInsertPrompt={supportsLocalAgent ? insertPrompt : undefined}
            onChangePrompt={supportsLocalAgent ? changePrompt : undefined}
            onSendPrompt={supportsLocalAgent ? sendPrompt : undefined}
            onOpenPromptSession={supportsLocalAgent ? openPromptSession : undefined}
            promptModels={promptModels}
            onSaveMarkdown={saveMarkdown}
            onFinishMarkdown={finishMarkdown}
            onCancelMarkdown={cancelMarkdown}
            editingRowId={editingRowId}
            onReorderRows={handleReorderRows}
            onDeleteRow={handleDeleteRow}
          />
        ) : (
          <p className="dbk-empty-tab">
            No tabs on this page.{' '}
            <button type="button" className="dbk-link-btn" onClick={handleAddTab}>
              Add a tab
            </button>
          </p>
        )}
      </PageLayout>
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        onCancel={() => {
          confirmState?.onResolve(false);
          setConfirmState(null);
        }}
        onConfirm={() => {
          confirmState?.onResolve(true);
          setConfirmState(null);
        }}
      />
    </>
  );
}
