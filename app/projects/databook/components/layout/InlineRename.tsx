import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

type InputProps = {
  value: string;
  onCommit: (next: string) => void;
  onCancel: () => void;
  className?: string;
  ariaLabel?: string;
};

export function RenameInput({ value, onCommit, onCancel, className = '', ariaLabel }: InputProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    else onCancel();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className={`dbk-inline-rename-input ${className}`.trim()}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel ?? 'Rename'}
      onClick={(e) => e.stopPropagation()}
      size={Math.max(draft.length, 4)}
    />
  );
}

type Props = {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
};

/** Click the label to rename; Enter commits, Escape cancels. */
export function InlineRename({ value, onCommit, className = '', ariaLabel, title }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <RenameInput
        value={value}
        className={className}
        ariaLabel={ariaLabel ?? 'Rename'}
        onCommit={(next) => {
          onCommit(next);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      className={`dbk-inline-rename-label ${className}`.trim()}
      onClick={() => setEditing(true)}
      title={title ?? 'Rename'}
      aria-label={ariaLabel ?? `Rename ${value}`}
    >
      {value}
    </button>
  );
}
