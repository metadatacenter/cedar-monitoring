// Read-side DTOs from cedar-monitor-server /logs/usage/* (mirror AggQueryResults). Durations are nanos.

import {PagedList} from './paged-list.model';

export interface UsageTotals {
  reqCount: number;
  errorCount: number;
  p50Nanos: number;
  p95Nanos: number;
  p99Nanos: number;
}

export interface TimeBucket {
  hourUtc: string;
  reqCount: number;
  errorCount: number;
}

export interface EndpointStat {
  component: string;
  className: string;
  methodName: string;
  httpMethod: string;
  reqCount: number;
  errorCount: number;
  p50Nanos: number;
  p95Nanos: number;
  p99Nanos: number;
  maxNanos: number;
}

export interface CypherStat {
  operation: string;
  runnableHash: string;
  sample: string;
  execCount: number;
  p50Nanos: number;
  p95Nanos: number;
  p99Nanos: number;
  maxNanos: number;
}

export interface UserStat {
  userId: string;
  authSource: string;
  apiKeyHash: string;
  reqCount: number;
  errorCount: number;
}

export interface Insights {
  slowestCypher: CypherStat[];
  slowestEndpoints: EndpointStat[];
  heaviestUsers: UserStat[];
  errorHotspots: EndpointStat[];
}

export interface UsageSummary {
  from: string;
  to: string;
  totals: UsageTotals;
  series: TimeBucket[];
}

export interface EndpointStatPage extends PagedList {
  endpoints: EndpointStat[];
}

export interface CypherStatPage extends PagedList {
  statements: CypherStat[];
}

export interface UserStatPage extends PagedList {
  users: UserStat[];
}
