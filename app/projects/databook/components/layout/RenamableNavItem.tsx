import { useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { MoreIcon } from './icons';
import { RenameInput } from './InlineRename';

type Props = {
  label: string;
  active?: boolean;
  onSelect: () => void;
  onCommit?: (label: string) => void;
  onDelete?: () => void;
  deleteLabel?: string;
  className?: string;
  wrapClassName?: string;
  selectButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  children?: ReactNode;
};

function wrapClassFor(className: string, wrapClassName: string | undefined, active: boolean) {
  const activeClass = active ? ' dbk-nav-item-active' : '';
  if (wrapClassName) return `${wrapClassName}${activeClass}`;
  if (className.includes('dbk-tabs-trigger')) return `dbk-tabs-trigger-wrap${activeClass}`;
  if (className.includes('dbk-page-chip')) return `dbk-page-chip-wrap${activeClass}`;
  return `dbk-sidebar-row${activeClass}`;
}

export function RenamableNavItem({
  label,
  active,
  onSelect,
  onCommit,
  onDelete,
  deleteLabel = 'Delete',
  className = 'dbk-sidebar-item',
  wrapClassName,
  selectButtonProps,
  children,
}: Props) {
  const [editing, setEditing] = useState(false);
  const actionsId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const startRename = () => {
    if (onCommit) setEditing(true);
  };

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    selectButtonProps?.onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (onCommit && (e.key === 'F2' || (e.key === 'Enter' && active && className.includes('dbk-sidebar-item')))) {
      e.preventDefault();
      startRename();
    }
  };

  return (
    <div className={wrapClassFor(className, wrapClassName, Boolean(active))}>
      {editing && onCommit ? (
        <RenameInput
          value={label}
          className="dbk-nav-rename-input"
          ariaLabel={`Rename ${label}`}
          onCommit={(next) => {
            onCommit(next);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <button
            type="button"
            {...selectButtonProps}
            className={`${className}${onDelete ? ' dbk-nav-has-actions' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (active && onCommit) startRename();
              else onSelect();
            }}
            onDoubleClick={
              onCommit
                ? (e) => {
                    e.preventDefault();
                    startRename();
                  }
                : undefined
            }
            onKeyDown={onButtonKeyDown}
            data-state={className.includes('dbk-tabs-trigger') ? (active ? 'active' : 'inactive') : undefined}
            title={onCommit ? 'Click to rename' : undefined}
          >
            <span className="dbk-nav-label">{children ?? label}</span>
          </button>
          {onDelete ? (
            <>
              <button
                type="button"
                className="dbk-nav-actions-trigger"
                aria-label={`Actions for ${label}`}
                popoverTarget={actionsId}
                onClick={(event) => event.currentTarget.focus()}
              >
                <MoreIcon />
              </button>
              <div
                ref={actionsRef}
                id={actionsId}
                popover="auto"
                className="dbk-nav-actions"
                onToggle={(event) => {
                  if (event.newState === 'open') deleteRef.current?.focus();
                }}
              >
                <button
                  ref={deleteRef}
                  type="button"
                  aria-label={deleteLabel === 'Delete' ? `Delete ${label}` : deleteLabel}
                  onClick={() => {
                    actionsRef.current?.hidePopover();
                    onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
