// Raw-row DTOs from cedar-monitor-server /logs/explorer/* (mirror LogExplorerResults). Durations nanos.

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
