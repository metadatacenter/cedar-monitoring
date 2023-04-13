import {CedarMonitoring} from "./cedar-monitoring.model";

export class ResourceReportUser extends CedarMonitoring {
  public keycloak: any;
  public neo4j: any;
  public opensearch: any;
  public cedarUser: any;
}
