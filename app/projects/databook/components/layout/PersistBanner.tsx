import type { PersistResult } from '../../data/persistBook';

type Props = {
  last?: PersistResult | null;
  error?: string | null;
  previewMode: boolean;
};

export function PersistBanner({ last, error, previewMode }: Props) {
  if (error) {
    return (
      <div className="dbk-persist-banner dbk-persist-banner-error" role="status">
        Could not save: {error}
      </div>
    );
  }
  if (previewMode && last?.via === 'local') {
    return (
      <div className="dbk-persist-banner" role="status">
        Edits saved in this browser only (run <code>npm run dev</code> to write{' '}
        <code>rows.json</code>).
      </div>
    );
  }
  if (last?.via === 'local' && !previewMode) {
    return (
      <div className="dbk-persist-banner" role="status">
        Saved locally — dev server unavailable.
      </div>
    );
  }
  return null;
}
