import {Component, OnInit} from '@angular/core';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CedarPageComponent} from '../../../shared/components/base/cedar-page-component.component';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {DataHandlerDataId} from '../../../shared/model/data-handler-data-id.model';
import {DataHandlerDataStatus} from '../../../shared/model/data-handler-data-status.model';
import {HttpClient} from '@angular/common/http';
import {UiService} from '../../../../services/ui.service';
import {AppConfigService} from '../../../../services/app-config.service';
import {HealthCheck} from "../../../../shared/model/health-check.model";
import {MicroservicesService} from "../../../../services/microservices.service";

@Component({
  selector: 'app-folder-content',
  templateUrl: './health-checks.component.html',
  styleUrls: ['./health-checks.component.scss']
})
export class HealthChecksComponent extends CedarPageComponent implements OnInit {

  public serverNames: string[] = [];
  public healthCheckMap: Map<string, HealthCheck> = new Map<string, HealthCheck>();
  public healthCheckStatusMap: Map<string, number> = new Map<string, number>();
  public nrLoaded: number = 0;
  public nrErrored: number = 0;
  public nrTotal: number = 0;

  constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    private http: HttpClient,
    private uiService: UiService,
    private configService: AppConfigService,
    private microservicesService: MicroservicesService
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler);
  }

  ngOnInit() {
    this.serverNames = this.microservicesService.getServerNames();
    this.nrTotal = this.serverNames.length;
    this.initDataHandler();
    for (let serverName of this.serverNames) {
      this.dataHandler
        .requireId(DataHandlerDataId.HEALTH_CHECK, serverName);
    }
    this.dataHandler
      .load(() => this.allDataLoadedCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.dataErrorCallback(error, dataStatus));
  }

  private allDataLoadedCallback() {
    for (let serverName of this.serverNames) {
      const v = this.dataStore.getHealthCheck(serverName);
      if (v) {
        this.healthCheckMap.set(serverName, v);
        this.nrLoaded++;
      }
    }
  }

  private dataErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.healthCheckStatusMap.set(dataStatus.id, error.status);
    this.nrErrored++;
  }

  getStatus(serverName: string): string {
    let status = this.healthCheckStatusMap.get(serverName);
    if (status) {
      return 'Error: ' + status;
    } else {
      return 'Health check loaded';
    }
  }

  getServerColor(serverName: string) {
    let status = this.healthCheckStatusMap.get(serverName);
    if (status) {
      return 'warn';
    } else {
      return 'primary';
    }
  }
}


