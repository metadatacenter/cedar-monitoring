import {CedarMonitoring} from "./cedar-monitoring.model";
import {MySqlTable} from "./mysql-table.model";

export class MySqlDatabase extends CedarMonitoring {
  name: string = '';
  /** Which configured datasource this schema was read through. */
  source: string = '';
  tableCount: number = 0;
  rowsApproximate: number = 0;
  rowsExact: number | null = null;
  dataBytes: number = 0;
  indexBytes: number = 0;
  totalBytes: number = 0;
  freeBytes: number = 0;
  tables: MySqlTable[] = [];
}
