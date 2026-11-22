import { useEffect, useState, type ReactNode } from 'react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Sidebar } from './Sidebar';
import { BookTabs } from './BookTabs';
import { InlineRename } from './InlineRename';
import { PanelToggle } from './PanelToggle';
import type { BookPage, TabSection } from '../../data/types';
import { RenamableNavItem } from './RenamableNavItem';

const siteUrl = '/';

const SIDEBAR_STORAGE_KEY = 'databook:sidebar-open';

function readSidebarOpen(fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // Storage can be unavailable.
  }
  return fallback;
}

function writeSidebarOpen(open: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // Ignore quota / private-mode failures.
  }
}

type Props = {
  title: string;
  tabs: TabSection[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab?: () => void;
  onRenameTab?: (tabId: string, label: string) => void;
  onDeleteTab?: (tabId: string) => void;
  onRenameTitle?: (title: string) => void;
  pages?: BookPage[];
  activePageId?: string;
  onSelectPage?: (pageId: string) => void;
  onAddPage?: () => void;
  onRenamePage?: (pageId: string, label: string) => void;
  onDeletePage?: (pageId: string) => void;
  banner?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function PageLayout({
  title,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  onRenameTitle,
  pages = [],
  activePageId = '',
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  banner,
  footer,
  children,
}: Props) {
  const hasPages = pages.length > 0 && Boolean(onSelectPage);
  const pageNav = Boolean(onAddPage);
  const [sidebarOpen, setSidebarOpen] = useState(() => readSidebarOpen(true));
  const showSidebar = pageNav && sidebarOpen;
  const returnLink = siteUrl ? <a className="dbk-return-link" href={siteUrl}>Back to site</a> : null;
  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  const showMobileSwitcher = hasPages && pages.length > 1;

  useEffect(() => {
    if (!pageNav) return;
    writeSidebarOpen(sidebarOpen);
  }, [pageNav, sidebarOpen]);

  useEffect(() => {
    if (!showSidebar) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSidebar]);

  const closeOverlayIfNarrow = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={`dbk-shell${showSidebar ? ' dbk-shell-sidebar-open' : ''}${
        pages.length > 1 ? ' dbk-shell-multi-page' : ''
      }`}
    >
      {showSidebar ? (
        <>
          <button
            type="button"
            className="dbk-sidebar-backdrop"
            aria-label="Hide pages sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar
            returnLink={returnLink}
            pages={pages}
            activePageId={activePageId}
            onSelectPage={(id) => {
              onSelectPage?.(id);
              closeOverlayIfNarrow();
            }}
            onAddPage={onAddPage}
            onRenamePage={onRenamePage}
            onDeletePage={onDeletePage}
            onHide={() => setSidebarOpen(false)}
          />
        </>
      ) : null}
      <div className="dbk-main-column">
        {banner}
        <header className="dbk-header">
          {!showSidebar ? returnLink : null}
          {pageNav && !showSidebar ? (
            <PanelToggle expanded={false} onClick={() => setSidebarOpen(true)} />
          ) : null}
          {onRenameTitle ? (
            <InlineRename
              value={title}
              onCommit={onRenameTitle}
              className="dbk-title"
              ariaLabel="Rename book"
              title="Rename book"
            />
          ) : (
            <div className="dbk-title">{title}</div>
          )}
          <div className="dbk-header-actions">
            <ThemeToggle />
          </div>
        </header>
        {showMobileSwitcher ? (
          <div className="dbk-page-switcher" role="navigation" aria-label="Book pages">
            <div className="dbk-page-switcher-scroll">
              {sortedPages.map((page) => (
                <RenamableNavItem
                  key={page.id}
                  label={page.label}
                  active={page.id === activePageId}
                  className="dbk-page-chip"
                  wrapClassName="dbk-page-chip-wrap"
                  onSelect={() => onSelectPage?.(page.id)}
                  onCommit={onRenamePage ? (label) => onRenamePage(page.id, label) : undefined}
                  onDelete={onDeletePage ? () => onDeletePage(page.id) : undefined}
                  deleteLabel={`Delete page ${page.label}`}
                />
              ))}
              {onAddPage ? (
                <button type="button" className="dbk-page-chip dbk-page-chip-add" onClick={onAddPage}>
                  Add page
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <main className="dbk-content">
          <BookTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={onSelectTab}
            onAddTab={onAddTab}
            onRenameTab={onRenameTab}
            onDeleteTab={onDeleteTab}
          >
            {children}
          </BookTabs>
        </main>
        {footer ? <footer className="dbk-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
