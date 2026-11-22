import type { BookDocument, ChartBlock } from './types';

/** All chart blocks across tabs (for refs, print-block, smoke). */
export function collectBlocks(book: BookDocument): ChartBlock[] {
  const out: ChartBlock[] = [];
  for (const tab of book.tabs) {
    for (const row of tab.rows) {
      if (row.type === 'component') out.push(...row.components);
    }
  }
  return out;
}
