import type { CanonicalDataset, Table } from './types';
import canonicalJson from './canonical.json';

export function loadCanonical(dataset: CanonicalDataset = canonicalJson as CanonicalDataset): Table {
  if (!dataset?.rows || !Array.isArray(dataset.rows)) {
    throw new Error('canonical.json must contain a rows array');
  }
  if (!dataset.schema || !Array.isArray(dataset.schema)) {
    throw new Error('canonical.json must contain a schema array');
  }
  return {
    schema: dataset.schema,
    rows: dataset.rows,
  };
}

export function getCanonicalMeta(dataset: CanonicalDataset = canonicalJson as CanonicalDataset) {
  return {
    grain: dataset.grain,
    hash: dataset.hash,
    builtAt: dataset.builtAt,
    status: dataset.status ?? 'ready',
    rowCount: dataset.rows?.length ?? 0,
  };
}
