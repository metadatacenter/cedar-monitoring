import {Injectable} from '@angular/core';
import {LocalSettingsService} from './local-settings.service';
import {HealthCheck} from "../shared/model/health-check.model";
import {ResourceIdLookup} from "../shared/model/resource-id-lookup.model";
import {ResourceReportUser} from "../shared/model/resource-report-user.model";
import {ResourceReportField} from "../shared/model/resource-report-field.model";
import {ResourceReportElement} from "../shared/model/resource-report-element.model";
import {ResourceReportTemplate} from "../shared/model/resource-report-template.model";
import {ResourceReportInstance} from "../shared/model/resource-report-instance.model";
import {ResourceReportGroup} from "../shared/model/resource-report-group.model";
import {ResourceReportFolder} from "../shared/model/resource-report-folder.model";

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  private healthCheckMap: Map<string, HealthCheck>;
  private resourceIdLookupMap: Map<string, ResourceIdLookup>;
  private resourceReportUserMap: Map<string, ResourceReportUser>;
  private resourceReportGroupMap: Map<string, ResourceReportGroup>;
  private resourceReportFolderMap: Map<string, ResourceReportFolder>;
  private resourceReportFieldMap: Map<string, ResourceReportField>;
  private resourceReportElementMap: Map<string, ResourceReportElement>;
  private resourceReportTemplateMap: Map<string, ResourceReportTemplate>;
  private resourceReportInstanceMap: Map<string, ResourceReportInstance>;

  constructor(
    private localSettings: LocalSettingsService
  ) {
    this.healthCheckMap = new Map<string, HealthCheck>();
    this.resourceIdLookupMap = new Map<string, ResourceIdLookup>();
    this.resourceReportUserMap = new Map<string, ResourceReportUser>();
    this.resourceReportGroupMap = new Map<string, ResourceReportGroup>();
    this.resourceReportFolderMap = new Map<string, ResourceReportFolder>();
    this.resourceReportFieldMap = new Map<string, ResourceReportField>();
    this.resourceReportElementMap = new Map<string, ResourceReportElement>();
    this.resourceReportTemplateMap = new Map<string, ResourceReportTemplate>();
    this.resourceReportInstanceMap = new Map<string, ResourceReportInstance>();
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

  setResourceReportGroup(groupId: string, report: ResourceReportGroup) {
    this.resourceReportGroupMap.set(groupId, report);
  }

  getResourceReportGroup(groupId: string): ResourceReportGroup | undefined {
    return this.resourceReportGroupMap.get(groupId);
  }

  setResourceReportFolder(folderId: string, report: ResourceReportFolder) {
    this.resourceReportFolderMap.set(folderId, report);
  }

  getResourceReportFolder(folderId: string): ResourceReportFolder | undefined {
    return this.resourceReportFolderMap.get(folderId);
  }

  setResourceReportField(fieldId: string, report: ResourceReportField) {
    this.resourceReportFieldMap.set(fieldId, report);
  }

  getResourceReportField(fieldId: string): ResourceReportField | undefined {
    return this.resourceReportFieldMap.get(fieldId);
  }

  setResourceReportElement(elementId: string, report: ResourceReportElement) {
    this.resourceReportElementMap.set(elementId, report);
  }

  getResourceReportElement(elementId: string): ResourceReportElement | undefined {
    return this.resourceReportElementMap.get(elementId);
  }

  setResourceReportTemplate(templateId: string, report: ResourceReportTemplate) {
    this.resourceReportTemplateMap.set(templateId, report);
  }

  getResourceReportTemplate(templateId: string): ResourceReportTemplate | undefined {
    return this.resourceReportTemplateMap.get(templateId);
  }

  setResourceReportInstance(instanceId: string, report: ResourceReportInstance) {
    this.resourceReportInstanceMap.set(instanceId, report);
  }

  getResourceReportInstance(instanceId: string): ResourceReportInstance | undefined {
    return this.resourceReportInstanceMap.get(instanceId);
  }

}
