export type ColumnType = 'quantitative' | 'temporal' | 'categorical' | 'boolean';

export type ColumnSpec = {
  name: string;
  type: ColumnType;
  label?: string;
  unit?: string;
  nullable?: boolean;
  levels?: string[];
  description?: string;
  binned?: { step: number; endColumn: string };
};

/** Temporal values are ISO date strings ('YYYY-MM-DD'), which sort lexically. */
export type Value = number | string | boolean | null;
export type DataRow = Record<string, Value>;

export type CanonicalDataset = {
  grain: string;
  schema: ColumnSpec[];
  rows: DataRow[];
  hash?: string;
  builtAt?: string;
  status?: 'ready' | 'building' | 'error';
};

export type Table = {
  schema: ColumnSpec[];
  rows: DataRow[];
};

// ---- Query objects (inlined on chart blocks) ----

export type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'is_null' | 'not_null';

export type FilterExpr = {
  column: string;
  op: FilterOp;
  value?: Value | Value[];
};

export type BinSpec = {
  column: string;
  step: number;
  /** Output column for the bin start; `${as}_end` holds the exclusive end. Defaults to `${column}_bin`. */
  as?: string;
  /** When true (default), fill empty histogram bins between observed min and max. */
  fillEmpty?: boolean;
};

export type AggFn =
  | 'count'
  | 'sum'
  | 'mean'
  | 'median'
  | 'min'
  | 'max'
  | 'count_distinct'
  | 'ratio'
  | 'share'
  | 'count_if'
  | 'sum_if'
  | 'mean_if';

export type AggSpec = {
  fn: AggFn;
  column?: string;
  denominator?: string;
  where?: FilterExpr;
  as: string;
  label?: string;
  unit?: string;
};

export type OrderSpec = { column: string; direction?: 'asc' | 'desc' };

export type ChartQuery = {
  id?: string;
  label?: string;
  filter?: FilterExpr[];
  groupBy?: string[];
  bin?: BinSpec[];
  aggregate?: AggSpec[];
  orderBy?: OrderSpec[];
  limit?: number;
  sample?: { n: number; seed?: number };
};

export type ChartBlock = {
  id: string;
  title: string;
  subtitle?: string;
  /** Reuse another chart by id (query + component). */
  ref?: string;
  /** `src/charts/<component>.tsx` default export. Required unless `ref` is set. */
  component?: string;
  query?: ChartQuery;
  notes?: string;
  flex?: number;
};

export type RowBase = {
  id: string;
  order: number;
  createdBy: 'skill' | 'user';
};

export type MarkdownRow = RowBase & {
  type: 'markdown';
  body: string;
};

export type ComponentRow = RowBase & {
  type: 'component';
  components: ChartBlock[];
  layout?: {
    gap?: number;
    align?: 'stretch' | 'start' | 'center';
    wrap?: boolean;
  };
};

export type CodexJobStatus = 'draft' | 'running' | 'needs_input' | 'done' | 'error';

export type PromptRow = RowBase & {
  type: 'prompt';
  prompt: string;
  model?: string;
  effort?: string;
  jobId?: string;
  sessionId?: string;
  status?: CodexJobStatus;
  startedAt?: string;
  finishedAt?: string;
  lastMessage?: string;
  error?: string;
};

export type BookRow = MarkdownRow | ComponentRow | PromptRow;

export type TabSection = {
  id: string;
  label: string;
  order: number;
  rows: BookRow[];
};

export type BookPage = {
  id: string;
  label: string;
  order: number;
  tabIds: string[];
};

export type BookConventions = {
  notes?: string[];
  population?: string;
  palette?: Record<string, string>;
};

export type BookDocument = {
  title: string;
  experimentId?: string;
  description?: string;
  generatedAt?: string;
  tabs: TabSection[];
  defaultTabId?: string;
  pages?: BookPage[];
  conventions?: BookConventions;
};
