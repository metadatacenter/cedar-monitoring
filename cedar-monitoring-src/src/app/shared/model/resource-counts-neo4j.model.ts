import {CedarMonitoring} from "./cedar-monitoring.model";

export class ResourceCountsNeo4j extends CedarMonitoring {
  user: number = -1;
  group: number = -1;
  category: number = -1;
  folder: number = -1;
  /** A subset of `folder`, not a figure beside it. The search index never holds one. */
  userHomeFolder: number = -1;
  /** Also a subset of `folder`, also never indexed. */
  systemFolder: number = -1;
  /**
   * The rest: neither a user home nor a system folder, and exactly what the search index holds.
   * Counted in the graph in its own right, so the three parts adding up to `folder` is a check.
   */
  regularFolder: number = -1;
  field: number = -1;
  element: number = -1;
  template: number = -1;
  instance: number = -1;
  all: number = -1;
}
