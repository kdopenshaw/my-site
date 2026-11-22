import { PlusIcon } from '../layout/icons';

type Props = {
  onInsertMarkdown: () => void;
  onInsertPrompt?: () => void;
  markdownLabel?: string;
  promptLabel?: string;
};

/** Quiet Jupyter-style (+) between rows — hover reveals markdown and prompt inserts. */
export function InsertGap({
  onInsertMarkdown,
  onInsertPrompt,
  markdownLabel = 'Insert markdown',
  promptLabel = 'Insert chart prompt',
}: Props) {
  return (
    <div className="dbk-insert-gap">
      <div className="dbk-insert-gap-inner">
        <span className="dbk-insert-gap-rule" aria-hidden="true" />
        <button
          type="button"
          className="dbk-insert-gap-btn"
          onClick={onInsertMarkdown}
          aria-label={markdownLabel}
          title={markdownLabel}
        >
          <span className="dbk-insert-gap-plus" aria-hidden="true">
            <PlusIcon />
          </span>
          <span className="dbk-insert-gap-kind">md</span>
        </button>
        {onInsertPrompt ? (
          <>
            <span className="dbk-insert-gap-split" aria-hidden="true" />
            <button
              type="button"
              className="dbk-insert-gap-btn"
              onClick={onInsertPrompt}
              aria-label={promptLabel}
              title={promptLabel}
            >
              <span className="dbk-insert-gap-plus" aria-hidden="true">
                <PlusIcon />
              </span>
              <span className="dbk-insert-gap-kind">chart</span>
            </button>
          </>
        ) : null}
        <span className="dbk-insert-gap-rule" aria-hidden="true" />
      </div>
    </div>
  );
}
