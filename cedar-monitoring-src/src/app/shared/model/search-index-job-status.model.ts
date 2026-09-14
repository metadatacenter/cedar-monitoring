import {CedarMonitoring} from "./cedar-monitoring.model";

/**
 * How far a search index rebuild has got.
 *
 * <p>Each phase counts its own units, because what is being counted changes with the phase: pages of
 * resources while enumerating, resources while indexing, nothing at all while promoting. A total of
 * -1 means the phase's denominator is not known yet, and a null rate means it has not been measured
 * yet rather than that nothing is happening.
 */
export class IndexingProgress {
  phase: string = 'PENDING';
  phaseDescription: string = '';
  processed: number = 0;
  total: number = -1;
  percentComplete: number | null = null;
  totalByType: { [type: string]: number } = {};
  processedByType: { [type: string]: number } = {};
  startedAt: string | null = null;
  lastUpdatedAt: string | null = null;
  unitsPerSecond: number | null = null;
  secondsRemaining: number | null = null;
  estimatedFinishAt: string | null = null;
}

/** What became of one index's most recent rebuild, or that none has run. */
export class IndexJobStatus {
  jobId: string | null = null;
  state: string = 'IDLE';
  command: string | null = null;
  startedAt: string | null = null;
  finishedAt: string | null = null;
  /** When a job that says nothing more will be believed to have stopped. */
  deadlineAt: string | null = null;
  overdue: boolean = false;
  failure: string | null = null;
  progress: IndexingProgress | null = null;
}

/** The state of each index a rebuild can contend over, keyed by index name. */
export class SearchIndexJobStatus extends CedarMonitoring {
  SEARCH: IndexJobStatus = new IndexJobStatus();
  RULES: IndexJobStatus = new IndexJobStatus();
}
