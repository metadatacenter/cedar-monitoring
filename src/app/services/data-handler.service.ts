import {Injectable} from '@angular/core';
import {DataHandlerDataStatus} from '../modules/shared/model/data-handler-data-status.model';
import {DataStoreService} from './data-store.service';
import {TranslateService} from '@ngx-translate/core';
import {DataHandlerDataId} from '../modules/shared/model/data-handler-data-id.model';
import {SpinnerService} from './spinner.service';
import {HealthChecksService} from "./load-data/health-checks.service";
import {HealthCheck} from "../shared/model/health-check.model";

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
    }
  }

  private handleLoadError(error: any, dataStatus: DataHandlerDataStatus) {
    if (this.errorCallback != null) {
      this.errorCallback(error, dataStatus);
    }
    this.spinner.hide();
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

  private dataWasLoaded(dataStatus: DataHandlerDataStatus) {
    dataStatus.loaded = true;
    this.checkCompletion();
  }

  private checkCompletion() {
    let allLoaded = true;
    this.dataIdMap.forEach((dataStatus: DataHandlerDataStatus) => {
      if (dataStatus.loaded === false && dataStatus.canceled === false) {
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
