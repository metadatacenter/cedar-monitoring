import {CedarMonitoring} from "./cedar-monitoring.model";

export class ResourceCountsOpensearch extends CedarMonitoring {
  folder: number = -1;
  field: number = -1;
  element: number = -1;
  template: number = -1;
  instance: number = -1;
  artifactTotal: number = -1;
  recommenderTotal: number = -1;
}
