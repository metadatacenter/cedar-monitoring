// Raw-row DTOs from cedar-monitor-server /logs/explorer/* (mirror LogExplorerResults). Durations nanos.

import {PagedList} from './paged-list.model';

export interface RequestRow {
  globalRequestId: string;
  requestTime: string;
  component: string;
  httpMethod: string;
  path: string;
  handler: string;
  userId: string;
  authSource: string;
  apiKeyHash: string;
  status: number | null;
  durationNanos: number;
  errorPack: string | null;
}

export interface CypherRow {
  logTime: string;
  component: string;
  operation: string;
  runnableHash: string;
  durationNanos: number;
  runnable: string;
  parameters: string;
  handler: string;
}

export interface RequestRowPage extends PagedList {
  requests: RequestRow[];
}

export interface CypherRowPage extends PagedList {
  statements: CypherRow[];
}
