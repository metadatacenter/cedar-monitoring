import {CedarMonitoring} from "./cedar-monitoring.model";

export class ResourceCountsNeo4j extends CedarMonitoring {
  user: number = -1;
  group: number = -1;
  category: number = -1;
  folder: number = -1;
  field: number = -1;
  element: number = -1;
  template: number = -1;
  instance: number = -1;
  all: number = -1;
}
