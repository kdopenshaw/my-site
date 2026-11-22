import { useEffect, useMemo, useState } from 'react';
import type { PromptRow as PromptRowModel } from '../../data/types';

type CodexModel = { slug: string; displayName: string };

type Props = {
  row: PromptRowModel;
  onChange?: (patch: Partial<PromptRowModel>) => void;
  onSend?: () => Promise<void> | void;
  onOpenSession?: () => Promise<void> | void;
  models?: CodexModel[];
};

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function statusLabel(status: PromptRowModel['status']): string {
  switch (status) {
    case 'running':
      return 'Working';
    case 'needs_input':
      return 'Needs input';
    case 'done':
      return 'Done';
    case 'error':
      return 'Error';
    default:
      return 'Draft';
  }
}

export function PromptRow({ row, onChange, onSend, onOpenSession, models = [] }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const started = row.startedAt ? Date.parse(row.startedAt) : NaN;
  const live = row.status === 'running' || row.status === 'needs_input';

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [live]);

  const elapsed = useMemo(() => {
    if (!Number.isFinite(started)) return 0;
    const end = row.finishedAt ? Date.parse(row.finishedAt) : now;
    return Math.max(0, end - started);
  }, [now, row.finishedAt, started]);

  const busy = row.status === 'running';
  const canSend = Boolean(onSend && row.prompt.trim() && !busy);
  const hasSession = Boolean(onOpenSession && (row.jobId || row.sessionId));
  const showElapsed = live || Boolean(row.finishedAt);

  return (
    <div className={`dbk-prompt-row dbk-prompt-row-${row.status ?? 'draft'}`}>
      <textarea
        className="dbk-prompt-text"
        rows={4}
        placeholder="Describe the visualization to add here…"
        value={row.prompt}
        disabled={busy}
        onChange={(e) => onChange?.({ prompt: e.target.value })}
      />
      {row.status === 'needs_input' ? (
        <p className="dbk-prompt-question">
          Codex has a question. Open the session to answer it.
        </p>
      ) : null}
      {row.lastMessage ? <p className="dbk-prompt-last">{row.lastMessage}</p> : null}
      {row.error && row.status === 'error' ? <p className="dbk-prompt-error">{row.error}</p> : null}
      <div className="dbk-prompt-toolbar">
        <select
          className="dbk-select"
          aria-label="Model"
          value={row.model ?? 'gpt-6-astra'}
          disabled={busy}
          onChange={(e) => onChange?.({ model: e.target.value })}
        >
          {(models.length ? models : [{ slug: row.model ?? 'gpt-6-astra', displayName: row.model ?? 'gpt-6-astra' }]).map(
            (m) => (
              <option key={m.slug} value={m.slug}>
                {m.displayName}
              </option>
            ),
          )}
        </select>
        <select
          className="dbk-select"
          aria-label="Effort"
          value={row.effort ?? 'medium'}
          disabled={busy}
          onChange={(e) => onChange?.({ effort: e.target.value })}
        >
          {['low', 'medium', 'high', 'xhigh', 'max'].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        {row.status && row.status !== 'draft' ? (
          <span className={`dbk-prompt-status dbk-prompt-status-${row.status}`}>
            {statusLabel(row.status)}
            {showElapsed ? ` · ${formatElapsed(elapsed)}` : null}
          </span>
        ) : (
          <span className="dbk-prompt-status" />
        )}
        <div className="dbk-prompt-actions">
          {hasSession ? (
            <button type="button" className="dbk-btn" onClick={() => void onOpenSession?.()}>
              Open session
            </button>
          ) : null}
          <button
            type="button"
            className="dbk-btn dbk-btn-primary"
            disabled={!canSend}
            onClick={() => void onSend?.()}
          >
            {busy ? 'Sending…' : row.status === 'done' || row.status === 'error' ? 'Send again' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { CodexModel };
