import type { BookDocument, ComponentRow as ComponentRowModel, Table } from '../../data/types';
import { ChartSlot } from './ChartSlot';

type Props = {
  row: ComponentRowModel;
  table: Table;
  book: BookDocument;
};

export function ComponentRow({ row, table, book }: Props) {
  const gap = row.layout?.gap ?? 16;
  const align = row.layout?.align ?? 'stretch';
  // Default wrap so multi-chart rows reflow instead of overflowing; agents may force nowrap.
  const wrap = row.layout?.wrap ?? true;

  return (
    <div
      className="dbk-row dbk-component-row"
      style={{
        gap,
        alignItems: align === 'start' ? 'flex-start' : align === 'center' ? 'center' : 'stretch',
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
    >
      {row.components.map((block) => (
        <ChartSlot key={block.id} block={block} table={table} book={book} flex={block.flex ?? 1} />
      ))}
    </div>
  );
}
