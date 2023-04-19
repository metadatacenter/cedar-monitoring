import {CedarMonitoring} from "./cedar-monitoring.model";

export class RedisQueueCounts extends CedarMonitoring {
  valuerecommender: number = -1;
  ncbiSubmission: number= -1;
  appLog: number = -1;
  searchPermission: number = -1;
}
