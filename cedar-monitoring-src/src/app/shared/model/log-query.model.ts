// DTOs for the structured query engine — cedar-monitor-server /logs/{query,facets,coverage}.
// Mirrors LogQuerySpec / LogQueryResults on the Java side. Durations are nanos; timestamps are ISO-8601.
// Design: cedar-development/ops/LOG-EXPLORER-UI-PLAN.md

export type LogTable = 'request' | 'cypher';

/**
 * Which store answers the query. 'raw' is the log tables — exact and row-level, but only as far
 * back as the retention window. 'rollup' is the hourly agg_* tables — cheap, kept forever,
 * hourly grain, and percentiles interpolated from histograms (so QueryResult.exact is false).
 */
export type LogSource = 'raw' | 'rollup';

export type FilterOp =
  'eq' | 'ne' | 'in' | 'notin' | 'like' | 'notlike' | 'startswith'
  | 'gte' | 'lte' | 'between' | 'isnull' | 'notnull';

export interface QueryFilter {
  col: string;
  op: FilterOp;
  val?: string;
  vals?: string[];
}

export interface QuerySort {
  key: string;
  dir: 'asc' | 'desc';
}

export interface QueryHaving {
  key: string;
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
  val: string;
}

/** The request body of POST /logs/query. groupBy empty ⇒ raw rows (keyset-paged). */
export interface LogQuerySpec {
  table: LogTable;
  from?: string;
  to?: string;
  filters?: QueryFilter[];
  groupBy?: string[];
  metrics?: string[];
  having?: QueryHaving[];
  orderBy?: QuerySort[];
  limit?: number;
  cursor?: string | null;
  source?: LogSource;
}

export type ColumnType = 'STRING' | 'NUMBER' | 'NANOS' | 'TIMESTAMP' | 'TEXT';

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  note?: string;
}

/** Results carry their own provenance so the page can state precision and caps honestly. */
export interface QueryResult {
  columns: ColumnMeta[];
  rows: Array<Record<string, any>>;
  rowCount: number;
  truncated: boolean;
  nextCursor: string | null;
  elapsedMs: number;
  exact: boolean;
  source: string;
  notes: string[];
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetResult {
  table: string;
  column: string;
  values: FacetValue[];
  truncated: boolean;
  elapsedMs: number;
  note?: string;
}

export interface ColumnInfo {
  key: string;
  label: string;
  kind: string;
  groupable: boolean;
  aggregatable: boolean;
  note?: string;
}

export interface TableCoverage {
  table: string;
  sqlTable: string;
  rowCount: number;
  oldest: string;
  newest: string;
  columns: ColumnInfo[];
}

export interface CoverageResult {
  tables: TableCoverage[];
  notes: string[];
}

/** One span in a trace: a component handling the request, or a single Cypher query underneath it. */
export interface TraceSpan {
  kind: 'request' | 'cypher';
  component: string;
  label: string;
  detail: string;
  status: number | null;
  startedAt: string;
  offsetMs: number;
  durationMs: number;
  localRequestId: string;
}

/**
 * One globalRequestId across the whole fleet. handlerMs sums overlapping component spans so it
 * exceeds spanMs (wall time) by design; dbSharePct is what says whether a slow request is actually
 * database-bound.
 */
export interface TraceResult {
  globalRequestId: string;
  spans: TraceSpan[];
  requestCount: number;
  cypherCount: number;
  componentCount: number;
  handlerMs: number;
  dbMs: number;
  dbSharePct: number;
  spanMs: number;
  truncated: boolean;
  elapsedMs: number;
  notes: string[];
}

/**
 * A pre-defined question. A board IS a saved LogQuerySpec — no bespoke endpoint — so opening one
 * loads its spec into the same controls and stays editable. The spec carries no from/to; the page
 * supplies the range, and defaultRangeMinutes is the suggested starting window.
 */
export interface Board {
  id: string;
  title: string;
  question: string;
  group: string;
  defaultRangeMinutes: number;
  spec: LogQuerySpec;
  note?: string;
  /**
   * Set only for questions that join both log tables and therefore cannot be a spec. The page GETs
   * this path with the current range instead of POSTing spec; the response shape is identical, so
   * the same table renders it.
   */
  endpoint?: string;
}
