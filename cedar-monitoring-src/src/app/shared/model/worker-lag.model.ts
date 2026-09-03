/**
 * The log pipeline's queue depth and write lag, from cedar-monitor-server /worker/lag.
 *
 * Depth alone does not say whether the pipeline is healthy — a deep queue that is draining fast is
 * fine — so the depth is reported beside the age of the newest row the worker actually wrote, and
 * the verdict those two imply.
 */

export type WorkerLagStatus = 'OK' | 'LAGGING' | 'STALLED' | 'UNKNOWN';

export interface LogTableLag {
  table: string;
  sqlTable: string;
  /** Null when the table is empty, which is not the same as being up to date. */
  newestAt: string | null;
  lagSeconds: number | null;
}

export interface WorkerLag {
  observedAt: string;
  appLogQueueDepth: number;
  tables: LogTableLag[];
  worstLagSeconds: number | null;
  status: WorkerLagStatus;
  laggingAfterSeconds: number;
  stalledAfterSeconds: number;
}
