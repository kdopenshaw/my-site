import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { TabSection } from '../../data/types';
import { ChevronRightIcon, PlusIcon } from './icons';
import { RenamableNavItem } from './RenamableNavItem';

type Props = {
  tabs: TabSection[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  onAddTab?: () => void;
  onRenameTab?: (tabId: string, label: string) => void;
  onDeleteTab?: (tabId: string) => void;
  children: ReactNode;
};

export function BookTabs({
  tabs,
  activeTabId,
  onSelect,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  children,
}: Props) {
  const sorted = [...tabs].sort((a, b) => a.order - b.order);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({
      left: el.scrollLeft > 2,
      right: max > 2 && el.scrollLeft < max - 2,
    });
  };

  useEffect(() => {
    updateOverflow();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateOverflow();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOverflow) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateOverflow);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
  }, [sorted.length, activeTabId]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const btn = listRef.current?.querySelector<HTMLElement>(`#tab-${activeTabId}`);
    btn?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [activeTabId]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const ids = sorted.map((t) => t.id);
    const i = ids.indexOf(activeTabId);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % ids.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + ids.length) % ids.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = ids.length - 1;
    onSelect(ids[next]);
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`#tab-${ids[next]}`)?.focus();
    });
  };

  const fadeClass = [
    'dbk-tabs-scroll',
    overflow.left ? 'dbk-tabs-scroll-fade-left' : '',
    overflow.right ? 'dbk-tabs-scroll-fade-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="dbk-tabs">
      <div className={fadeClass} data-overflow={overflow.right || overflow.left ? 'true' : 'false'}>
        <div className="dbk-tabs-scroll-inner" ref={scrollRef}>
          <div
            className="dbk-tabs-list"
            role="tablist"
            aria-label="Book tabs"
            ref={listRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
          >
            {sorted.map((tab) => {
              const active = tab.id === activeTabId;
              return (
                <RenamableNavItem
                  key={tab.id}
                  label={tab.label}
                  active={active}
                  className="dbk-tabs-trigger"
                  selectButtonProps={{
                    role: 'tab',
                    id: `tab-${tab.id}`,
                    'aria-selected': active,
                    'aria-controls': `panel-${tab.id}`,
                    tabIndex: active ? 0 : -1,
                  }}
                  onSelect={() => onSelect(tab.id)}
                  onCommit={onRenameTab ? (label) => onRenameTab(tab.id, label) : undefined}
                  onDelete={onDeleteTab ? () => onDeleteTab(tab.id) : undefined}
                  deleteLabel={`Delete tab ${tab.label}`}
                />
              );
            })}
            {onAddTab ? (
              <div className="dbk-tabs-add">
                <button
                  type="button"
                  className="dbk-tabs-add-btn"
                  onClick={onAddTab}
                  aria-label="Add tab"
                  title="Add tab"
                >
                  <PlusIcon />
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {overflow.right ? (
          <span className="dbk-tabs-scroll-cue" aria-hidden="true">
            <ChevronRightIcon />
          </span>
        ) : null}
      </div>
      <div
        className="dbk-tabs-panel"
        role="tabpanel"
        id={`panel-${activeTabId}`}
        aria-labelledby={`tab-${activeTabId}`}
        hidden={!activeTabId}
      >
        {children}
      </div>
    </div>
  );
}
