import {CedarMonitoring} from "./cedar-monitoring.model";

/**
 * Three depths per queue, as the monitor server reports them.
 *
 * `<queue>` is waiting to be claimed, `<queue>Processing` is claimed and not yet acknowledged, and
 * `<queue>DeadLetter` is parked after repeated handling failures. The last two used to need
 * redis-cli on the app host: processing stuck at 1 is how a wedged permission cascade looks, and a
 * dead-letter depth is reported by the worker's health check rather than making it unhealthy, so
 * this page is where it has to be readable.
 *
 * -1 means "not loaded yet", as elsewhere in these models.
 */
export class RedisQueueCounts extends CedarMonitoring {
  valuerecommender: number = -1;
  valuerecommenderProcessing: number = -1;
  valuerecommenderDeadLetter: number = -1;
  ncbiSubmission: number = -1;
  ncbiSubmissionProcessing: number = -1;
  ncbiSubmissionDeadLetter: number = -1;
  appLog: number = -1;
  appLogProcessing: number = -1;
  appLogDeadLetter: number = -1;
  searchPermission: number = -1;
  searchPermissionProcessing: number = -1;
  searchPermissionDeadLetter: number = -1;
  cloneInstances: number = -1;
  cloneInstancesProcessing: number = -1;
  cloneInstancesDeadLetter: number = -1;
}
