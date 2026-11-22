type Props = {
  expanded: boolean;
  onClick: () => void;
};

/** Classic “show sidebar” panel icon at the content edge. */
export function PanelToggle({ expanded, onClick }: Props) {
  return (
    <button
      type="button"
      className="dbk-panel-toggle"
      aria-expanded={expanded}
      aria-label={expanded ? 'Hide pages sidebar' : 'Show pages sidebar'}
      title={expanded ? 'Hide pages' : 'Show pages'}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect
          x="1.5"
          y="2.5"
          width="13"
          height="11"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path d="M5.5 2.5v11" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </button>
  );
}
