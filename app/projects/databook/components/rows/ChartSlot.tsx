import { useMemo } from 'react';
import { resolveBookChart } from '../../charts/registry';
import type { BookDocument, ChartBlock, Table } from '../../data/types';
import { resolveChartBlock } from '../../data/resolveChartBlock';
import { QueryError, runQuery } from '../../data/runQuery';

type Props = {
  block: ChartBlock;
  table: Table;
  book: BookDocument;
  flex?: number;
};

export function ChartSlot({ block, table, book, flex = 1 }: Props) {
  const resolved = useMemo(() => {
    try {
      return { block: resolveChartBlock(book, block), error: null as string | null };
    } catch (err) {
      return { block: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [book, block]);

  const result = useMemo(() => {
    if (!resolved.block?.query) return { rows: [], error: resolved.error };
    try {
      const rows = runQuery(table, resolved.block.query);
      return { rows, error: null as string | null };
    } catch (err) {
      if (err instanceof QueryError) return { rows: [], error: err.message };
      return { rows: [], error: err instanceof Error ? err.message : String(err) };
    }
  }, [table, resolved]);

  const live = resolved.block;
  const title = live?.title ?? block.title;
  const subtitle = live?.subtitle;
  const header = (
    <div className="dbk-chart-header">
      <h3 className="dbk-chart-title">{title}</h3>
      {subtitle ? (
        <p className="dbk-chart-subtitle">{subtitle}</p>
      ) : (
        <p className="dbk-chart-subtitle dbk-chart-subtitle-spacer" aria-hidden />
      )}
    </div>
  );

  const style = { flex: `${flex} 1 240px` };

  if (resolved.error || !live) {
    return (
      <div className="dbk-chart-slot" style={style} role="alert">
        {header}
        <div className="dbk-chart-error">{resolved.error ?? 'Invalid chart'}</div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="dbk-chart-slot" style={style} role="alert">
        {header}
        <div className="dbk-chart-error">{result.error}</div>
      </div>
    );
  }

  if (!result.rows.length) {
    return (
      <div className="dbk-chart-slot" style={style} data-empty="true">
        {header}
        <p className="dbk-chart-empty">No rows for this chart’s query.</p>
      </div>
    );
  }

  const Comp = resolveBookChart(live.component!);
  const body = Comp ? (
    <Comp data={result.rows} />
  ) : (
    <div className="dbk-chart-error">
      Unknown chart component "{live.component}". Add src/charts/{live.component}.tsx
    </div>
  );

  return (
    <div className="dbk-chart-slot" style={style}>
      {header}
      {body}
      {live.notes ? <p className="dbk-chart-notes">{live.notes}</p> : null}
    </div>
  );
}
