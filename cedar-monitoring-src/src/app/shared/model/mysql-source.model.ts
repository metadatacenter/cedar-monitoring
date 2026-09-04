import {CedarMonitoring} from "./cedar-monitoring.model";

export class MySqlSource extends CedarMonitoring {
  /** The datasource's short name, as the databases below refer to it. */
  id: string = '';
  /** The key it is configured under in cedar-main.yml. */
  configKey: string = '';
  configured: boolean = false;
  server: string | null = null;
  schema: string | null = null;
  reachable: boolean = false;
  error: string | null = null;
  /** Every schema this connection's user can see, which may be more than the one it connects to. */
  schemas: string[] = [];
}
