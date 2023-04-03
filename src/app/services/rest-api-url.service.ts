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

  private resourceReportFields() {
    return `${this.base()}resource/template-fields`;
  }

  private resourceReportElements() {
    return `${this.base()}resource/template-elements`;
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

  resourceReportField(fieldId: string) {
    return `${this.resourceReportFields()}/${encodeURIComponent(fieldId)}`;
  }

  resourceReportElement(elementId: string) {
    return `${this.resourceReportElements()}/${encodeURIComponent(elementId)}`;
  }
}
