import type { ReactNode } from 'react';
import type { BookPage } from '../../data/types';
import { PlusIcon } from './icons';
import { PanelToggle } from './PanelToggle';
import { RenamableNavItem } from './RenamableNavItem';

type Props = {
  returnLink?: ReactNode;
  pages: BookPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage?: () => void;
  onRenamePage?: (pageId: string, label: string) => void;
  onDeletePage?: (pageId: string) => void;
  onHide?: () => void;
};

export function Sidebar({
  returnLink,
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onHide,
}: Props) {
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  return (
    <aside className="dbk-sidebar" aria-label="Book pages">
      <div className="dbk-sidebar-head">
        {returnLink}
        {onHide ? <PanelToggle expanded onClick={onHide} /> : null}
      </div>
      <nav className="dbk-sidebar-nav">
        {sorted.map((page) => (
          <RenamableNavItem
            key={page.id}
            label={page.label}
            active={page.id === activePageId}
            onSelect={() => onSelectPage(page.id)}
            onCommit={onRenamePage ? (label) => onRenamePage(page.id, label) : undefined}
            onDelete={onDeletePage ? () => onDeletePage(page.id) : undefined}
            deleteLabel={`Delete page ${page.label}`}
          />
        ))}
        {onAddPage ? (
          <button type="button" className="dbk-sidebar-item dbk-sidebar-add" onClick={onAddPage}>
            <PlusIcon />
            Add page
          </button>
        ) : null}
      </nav>
    </aside>
  );
}
