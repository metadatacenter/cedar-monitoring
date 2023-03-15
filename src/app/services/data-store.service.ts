import {Injectable} from '@angular/core';
import {LocalSettingsService} from './local-settings.service';
import {HealthCheck} from "../shared/model/health-check.model";
import {ResourceIdLookup} from "../shared/model/resource-id-lookup.model";
import {ResourceReportUser} from "../shared/model/resource-report-user.model";

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  private healthCheckMap: Map<string, HealthCheck>;
  private resourceIdLookupMap: Map<string, ResourceIdLookup>;
  private resourceReportUserMap: Map<string, ResourceReportUser>;

  constructor(
    private localSettings: LocalSettingsService
  ) {
    this.healthCheckMap = new Map<string, HealthCheck>();
    this.resourceIdLookupMap = new Map<string, ResourceIdLookup>();
    this.resourceReportUserMap = new Map<string, ResourceReportUser>();
  }

  setHealthCheck(server: string, healthCheck: HealthCheck) {
    this.healthCheckMap.set(server, healthCheck);
  }

  getHealthCheck(server: string): HealthCheck | undefined {
    return this.healthCheckMap.get(server);
  }

  setResourceIdLookup(resourceId: string, resourceIdLookup: ResourceIdLookup) {
    this.resourceIdLookupMap.set(resourceId, resourceIdLookup);
  }

  getResourceIdLookup(resourceId: string): ResourceIdLookup | undefined {
    return this.resourceIdLookupMap.get(resourceId);
  }

  setResourceReportUser(userId: string, report: ResourceReportUser) {
    this.resourceReportUserMap.set(userId, report);
  }

  getResourceReportUser(userId: string): ResourceReportUser | undefined {
    return this.resourceReportUserMap.get(userId);
  }

}
