import {Injectable} from '@angular/core';
import {DataHandlerDataStatus} from '../modules/shared/model/data-handler-data-status.model';
import {DataStoreService} from './data-store.service';
import {TranslateService} from '@ngx-translate/core';
import {DataHandlerDataId} from '../modules/shared/model/data-handler-data-id.model';
import {SpinnerService} from './spinner.service';
import {HealthChecksService} from "./load-data/health-checks.service";
import {HealthCheck} from "../shared/model/health-check.model";
import {ResourceIdLookup} from "../shared/model/resource-id-lookup.model";
import {ResourceIdLookupService} from "./load-data/resource-id-lookup.service";
import {ResourceReportUserService} from "./load-data/resource-report-user.service";
import {ResourceReportUser} from "../shared/model/resource-report-user.model";
import {ResourceReportFieldService} from "./load-data/resource-report-field.service";
import {ResourceReportField} from "../shared/model/resource-report-field.model";
import {ResourceReportElementService} from "./load-data/resource-report-element.service";
import {ResourceReportElement} from "../shared/model/resource-report-element.model";
import {ResourceReportTemplate} from "../shared/model/resource-report-template.model";
import {ResourceReportTemplateService} from "./load-data/resource-report-template.service";
import {ResourceReportInstance} from "../shared/model/resource-report-instance.model";
import {ResourceReportInstanceService} from "./load-data/resource-report-instance.service";
import {ResourceReportGroup} from "../shared/model/resource-report-group.model";
import {ResourceReportGroupService} from "./load-data/resource-report-group.service";
import {ResourceReportFolder} from "../shared/model/resource-report-folder.model";
import {ResourceReportFolderService} from "./load-data/resource-report-folder.service";

@Injectable({
  providedIn: 'root'
})
export class DataHandlerService {

  private dataIdMap: Map<string, DataHandlerDataStatus>;
  private dataAvailable: boolean;
  private successCallback?: Function;
  private errorCallback?: Function;
  private preCallback: Function | null;

  constructor(
    public dataStore: DataStoreService,
    public spinner: SpinnerService,
    private translateService: TranslateService,
    private healthChecksService: HealthChecksService,
    private resourceIdLookupService: ResourceIdLookupService,
    private resourceReportUserService: ResourceReportUserService,
    private resourceReportGroupService: ResourceReportGroupService,
    private resourceReportFolderService: ResourceReportFolderService,
    private resourceReportFieldService: ResourceReportFieldService,
    private resourceReportElementService: ResourceReportElementService,
    private resourceReportTemplateService: ResourceReportTemplateService,
    private resourceReportInstanceService: ResourceReportInstanceService
  ) {
    this.dataIdMap = new Map<string, DataHandlerDataStatus>();
    this.dataAvailable = false;
    this.successCallback = undefined;
    this.errorCallback = undefined;
    this.preCallback = null;
  }

  reset(): DataHandlerService {
    this.spinner.hide();
    this.dataIdMap.clear();
    this.dataAvailable = false;
    this.successCallback = undefined;
    this.errorCallback = undefined;
    this.healthChecksService.reset();
    this.resourceIdLookupService.reset();
    this.resourceReportUserService.reset();
    this.resourceReportGroupService.reset();
    this.resourceReportFolderService.reset();
    this.resourceReportFieldService.reset();
    this.resourceReportElementService.reset();
    this.resourceReportTemplateService.reset();
    this.resourceReportInstanceService.reset();
    return this;
  }

  require(dataId: DataHandlerDataId): DataHandlerService {
    const status: DataHandlerDataStatus = DataHandlerDataStatus.forDataId(dataId);
    this.dataIdMap.set(status.getKey() ?? '', status);
    return this;
  }

  requireId(dataId: DataHandlerDataId, id: string): DataHandlerService {
    const status: DataHandlerDataStatus = DataHandlerDataStatus.forDataIdAndId(dataId, id);
    this.dataIdMap.set(status.getKey() ?? '', status);
    return this;
  }

  load(successCallback?: Function, errorCallback?: Function) {
    this.spinner.show();
    this.dataAvailable = false;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.dataIdMap.forEach((dataStatus: DataHandlerDataStatus) => {
      this.loadData(dataStatus);
      if (dataStatus.canceled) {
        this.checkCompletion();
      }
    });
  }

  setPreCallback(preCallback: Function) {
    this.preCallback = preCallback;
  }

  private loadData(dataStatus: DataHandlerDataStatus) {
    switch (dataStatus.dataId) {
      case DataHandlerDataId.HEALTH_CHECK:
        this.loadHealthCheck(dataStatus);
        break;
      case DataHandlerDataId.DETECT_RESOURCE_ID:
        this.loadResourceIdLookup(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_USER:
        this.loadResourceReportUser(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_GROUP:
        this.loadResourceReportGroup(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_FOLDER:
        this.loadResourceReportFolder(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_FIELD:
        this.loadResourceReportField(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_ELEMENT:
        this.loadResourceReportElement(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_TEMPLATE:
        this.loadResourceReportTemplate(dataStatus);
        break;
      case DataHandlerDataId.RESOURCE_REPORT_INSTANCE:
        this.loadResourceReportInstance(dataStatus);
        break;
    }
  }

  private handleLoadError(error: any, dataStatus: DataHandlerDataStatus) {
    dataStatus.errored = true;
    if (this.errorCallback != null) {
      this.errorCallback(error, dataStatus);
    }
    this.checkCompletion();
  }

  private loadHealthCheck(dataStatus: DataHandlerDataStatus) {
    this.healthChecksService.getHealthCheck(dataStatus.id)
      ?.subscribe(healthCheck => {
          this.dataStore.setHealthCheck(dataStatus.id, Object.assign(new HealthCheck(), healthCheck));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceIdLookup(dataStatus: DataHandlerDataStatus) {
    this.resourceIdLookupService.getResourceIdLookup(dataStatus.id)
      ?.subscribe(resourceIdLookup => {
          this.dataStore.setResourceIdLookup(dataStatus.id, Object.assign(new ResourceIdLookup(), resourceIdLookup));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportUser(dataStatus: DataHandlerDataStatus) {
    this.resourceReportUserService.getResourceReportUser(dataStatus.id)
      ?.subscribe(resourceReportUser => {
          this.dataStore.setResourceReportUser(dataStatus.id, Object.assign(new ResourceReportUser(), resourceReportUser));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportGroup(dataStatus: DataHandlerDataStatus) {
    this.resourceReportGroupService.getResourceReportGroup(dataStatus.id)
      ?.subscribe(resourceReportGroup => {
          this.dataStore.setResourceReportGroup(dataStatus.id, Object.assign(new ResourceReportGroup(), resourceReportGroup));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportFolder(dataStatus: DataHandlerDataStatus) {
    this.resourceReportFolderService.getResourceReportFolder(dataStatus.id)
      ?.subscribe(resourceReportFolder => {
          this.dataStore.setResourceReportFolder(dataStatus.id, Object.assign(new ResourceReportFolder(), resourceReportFolder));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportField(dataStatus: DataHandlerDataStatus) {
    this.resourceReportFieldService.getResourceReportField(dataStatus.id)
      ?.subscribe(resourceReportField => {
          this.dataStore.setResourceReportField(dataStatus.id, Object.assign(new ResourceReportField(), resourceReportField));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportElement(dataStatus: DataHandlerDataStatus) {
    this.resourceReportElementService.getResourceReportElement(dataStatus.id)
      ?.subscribe(resourceReportElement => {
          this.dataStore.setResourceReportElement(dataStatus.id, Object.assign(new ResourceReportElement(), resourceReportElement));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportTemplate(dataStatus: DataHandlerDataStatus) {
    this.resourceReportTemplateService.getResourceReportTemplate(dataStatus.id)
      ?.subscribe(resourceReportTemplate => {
          this.dataStore.setResourceReportTemplate(dataStatus.id, Object.assign(new ResourceReportTemplate(), resourceReportTemplate));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private loadResourceReportInstance(dataStatus: DataHandlerDataStatus) {
    this.resourceReportInstanceService.getResourceReportInstance(dataStatus.id)
      ?.subscribe(resourceReportInstance => {
          this.dataStore.setResourceReportInstance(dataStatus.id, Object.assign(new ResourceReportInstance(), resourceReportInstance));
          this.dataWasLoaded(dataStatus);
        },
        (error) => {
          this.handleLoadError(error, dataStatus);
        });
  }

  private dataWasLoaded(dataStatus: DataHandlerDataStatus) {
    dataStatus.loaded = true;
    this.checkCompletion();
  }

  private checkCompletion() {
    let allLoaded = true;
    this.dataIdMap.forEach((dataStatus: DataHandlerDataStatus) => {
      if (!dataStatus.loaded && !dataStatus.canceled && !dataStatus.errored) {
        allLoaded = false;
      }
    });
    if (allLoaded) {
      this.spinner.hide();
      if (this.preCallback != null) {
        this.preCallback();
      }
      if (this.successCallback != null) {
        this.successCallback();
      }
      this.dataAvailable = true;
    }
  }

  public dataIsAvailable() {
    return this.dataAvailable;
  }

}
