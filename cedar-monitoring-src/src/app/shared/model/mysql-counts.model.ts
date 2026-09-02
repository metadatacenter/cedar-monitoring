import {CedarMonitoring} from "./cedar-monitoring.model";
import {MySqlDatabase} from "./mysql-database.model";
import {MySqlSource} from "./mysql-source.model";

export class MySqlCounts extends CedarMonitoring {
  /** Whether the row counts below were counted or estimated. */
  exactCounts: boolean = false;
  sources: MySqlSource[] = [];
  databases: MySqlDatabase[] = [];
}
