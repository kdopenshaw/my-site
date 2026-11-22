import { collectBlocks } from './chartBlocks';
import type { BookDocument, ChartBlock } from './types';

/** Resolve `ref` to a concrete chart block (title/subtitle/notes/flex may override). */
export function resolveChartBlock(book: BookDocument, block: ChartBlock): ChartBlock {
  if (!block.ref) {
    if (!block.query || !block.component) {
      throw new Error(`Chart "${block.id}" needs component + query (or a ref)`);
    }
    return block;
  }
  const target = collectBlocks(book).find((b) => b.id === block.ref && !b.ref);
  if (!target?.query || !target.component) {
    throw new Error(`Chart "${block.id}" ref "${block.ref}" not found (or not renderable)`);
  }
  return {
    ...target,
    id: block.id,
    title: block.title || target.title,
    subtitle: block.subtitle ?? target.subtitle,
    notes: block.notes ?? target.notes,
    flex: block.flex ?? target.flex,
    ref: undefined,
  };
}
