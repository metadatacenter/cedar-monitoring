import {CedarMonitoring} from "./cedar-monitoring.model";
import {ResourceCountsNeo4j} from "./resource-counts-neo4j.model";
import {ResourceCountsMongo} from "./resource-counts-mongo.model";
import {ResourceCountsOpensearch} from "./resource-counts-opensearch.model";

export class ResourceCounts extends CedarMonitoring {
  neo4j: ResourceCountsNeo4j = new ResourceCountsNeo4j();
  mongo: ResourceCountsMongo = new ResourceCountsMongo();
  opensearch: ResourceCountsOpensearch = new ResourceCountsOpensearch();
}
