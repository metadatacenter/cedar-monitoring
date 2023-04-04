import {Injectable} from '@angular/core';
import {AppConfigService} from './app-config.service';
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class RestApiUrlService {

  private configService: AppConfigService;

  private API_URL: string;

  constructor(configService: AppConfigService) {
    this.configService = configService;
    this.API_URL = environment.apiUrl;
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
    return `${this.resourceIdLookups()}/${encodeURIComponent(resourceId)}`;
  }

  public resourceReportUser(userId: string) {
    return `${this.resourceReportUsers()}/${encodeURIComponent(userId)}`;
  }

  public resourceReportGroup(groupId: string) {
    return `${this.resourceReportGroups()}/${encodeURIComponent(groupId)}`;
  }

  public resourceReportFolder(folderId: string) {
    return `${this.resourceReportFolders()}/${encodeURIComponent(folderId)}`;
  }

  resourceReportField(fieldId: string) {
    return `${this.resourceReportFields()}/${encodeURIComponent(fieldId)}`;
  }

  resourceReportElement(elementId: string) {
    return `${this.resourceReportElements()}/${encodeURIComponent(elementId)}`;
  }

  resourceReportTemplate(templateId: string) {
    return `${this.resourceReportTemplates()}/${encodeURIComponent(templateId)}`;
  }

  resourceReportInstance(instanceId: string) {
    return `${this.resourceReportInstances()}/${encodeURIComponent(instanceId)}`;
  }
}
