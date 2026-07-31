import {Injectable} from '@angular/core';
import {AppConfigService} from './app-config.service';
import {globalAppConfig} from "../../environments/global-app-config";

@Injectable({
  providedIn: 'root'
})
export class RestApiUrlService {

  private configService: AppConfigService;

  private API_URL: string;

  constructor(configService: AppConfigService) {
    this.configService = configService;
    this.API_URL = globalAppConfig.apiUrl;
  }

  private base() {
    return `${this.API_URL}`;
  }

  private healthChecks() {
    return `${this.base()}health-check`;
  }

  private resourceIdLookups() {
    return `${this.base()}command/resource-id-lookup`;
  }

  private resourceReportUsers() {
    return `${this.base()}resource/users`;
  }

  private resourceReportGroups() {
    return `${this.base()}resource/groups`;
  }

  private resourceReportFolders() {
    return `${this.base()}resource/folders`;
  }

  private resourceReportFields() {
    return `${this.base()}resource/template-fields`;
  }

  private resourceReportElements() {
    return `${this.base()}resource/template-elements`;
  }

  private resourceReportTemplates() {
    return `${this.base()}resource/templates`;
  }

  private resourceReportInstances() {
    return `${this.base()}resource/template-instances`;
  }

  public healthCheck(server: string) {
    return `${this.healthChecks()}/${encodeURIComponent(server)}`;
  }

  public resourceIdLookup(resourceId: string) {
    return `${this.resourceIdLookups()}?input=${encodeURIComponent(resourceId)}`;
  }

  public resourceReportUser(userId: string) {
    return `${this.resourceReportUsers()}?id=${encodeURIComponent(userId)}`;
  }

  public resourceReportGroup(groupId: string) {
    return `${this.resourceReportGroups()}?id=${encodeURIComponent(groupId)}`;
  }

  public resourceReportFolder(folderId: string) {
    return `${this.resourceReportFolders()}?id=${encodeURIComponent(folderId)}`;
  }

  resourceReportField(fieldId: string) {
    return `${this.resourceReportFields()}?id=${encodeURIComponent(fieldId)}`;
  }

  resourceReportElement(elementId: string) {
    return `${this.resourceReportElements()}?id=${encodeURIComponent(elementId)}`;
  }

  resourceReportTemplate(templateId: string) {
    return `${this.resourceReportTemplates()}?id=${encodeURIComponent(templateId)}`;
  }

  resourceReportInstance(instanceId: string) {
    return `${this.resourceReportInstances()}?id=${encodeURIComponent(instanceId)}`;
  }

  redisQueueCounts() {
    return `${this.base()}redis/queue-counts`;
  }

  resourceCounts() {
    return `${this.base()}resources/counts`;
  }

  resourceCountsOpensearch() {
    return `${this.base()}resources/counts/opensearch`;
  }

  private logsRange(path: string, from: string, to: string, limit?: number) {
    let url = `${this.base()}logs/usage/${path}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    if (limit != null) {
      url += `&limit=${limit}`;
    }
    return url;
  }

  logsUsageSummary(from: string, to: string) {
    return this.logsRange('summary', from, to);
  }

  logsUsageEndpoints(from: string, to: string, limit: number) {
    return this.logsRange('endpoints', from, to, limit);
  }

  logsUsageCypher(from: string, to: string, limit: number) {
    return this.logsRange('cypher', from, to, limit);
  }

  logsUsageUsers(from: string, to: string, limit: number) {
    return this.logsRange('users', from, to, limit);
  }

  logsUsageInsights(from: string, to: string) {
    return this.logsRange('insights', from, to);
  }

  private logsExplorer(path: string, q: string, minDurationMs: number, limit: number) {
    let url = `${this.base()}logs/explorer/${path}?limit=${limit}`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }
    if (minDurationMs > 0) {
      url += `&minDurationMs=${minDurationMs}`;
    }
    return url;
  }

  logsExplorerRequests(q: string, minDurationMs: number, limit: number) {
    return this.logsExplorer('requests', q, minDurationMs, limit);
  }

  logsExplorerCypher(q: string, minDurationMs: number, limit: number) {
    return this.logsExplorer('cypher', q, minDurationMs, limit);
  }

  /**
   * Structured query engine. POST because a spec with several filters plus a metric list exceeds a
   * sane URL length — the shareable state lives in the Angular route, not here.
   */
  logsQuery() {
    return `${this.base()}logs/query`;
  }

  logsFacet(table: string, column: string, from: string, to: string) {
    return `${this.base()}logs/facets/${encodeURIComponent(column)}`
      + `?table=${encodeURIComponent(table)}`
      + `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  }

  logsCoverage() {
    return `${this.base()}logs/coverage`;
  }
}
