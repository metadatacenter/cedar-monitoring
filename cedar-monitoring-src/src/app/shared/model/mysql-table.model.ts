import {CedarMonitoring} from "./cedar-monitoring.model";

export class MySqlTable extends CedarMonitoring {
  name: string = '';
  engine: string | null = null;
  /** The optimizer's estimate, which for InnoDB is sampled and approximate. Null when it has none. */
  rowsApproximate: number | null = null;
  /** A real COUNT(*), present only when the report was asked for exact counts. */
  rowsExact: number | null = null;
  dataBytes: number = 0;
  indexBytes: number = 0;
  totalBytes: number = 0;
  /** Pages the table has released but not returned to the filesystem. */
  freeBytes: number = 0;
  averageRowBytes: number | null = null;
  createdAt: string | null = null;
  updatedAt: string | null = null;
  /** Why an exact count is missing for this table, when one was asked for and failed. */
  countError: string | null = null;
}
