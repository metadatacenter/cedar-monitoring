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

@Component({
  selector: 'app-folder-content',
  templateUrl: './health-checks.component.html',
  styleUrls: ['./health-checks.component.scss']
})
export class HealthChecksComponent extends CedarPageComponent implements OnInit {

  public healthCheck?: HealthCheck = undefined;
  public healthChecksStatus: number = 0;

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
    private configService: AppConfigService
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler);
  }

  ngOnInit() {
    this.initDataHandler();
    this.dataHandler
      .requireId(DataHandlerDataId.HEALTH_CHECK, "resource")
      .load(() => this.dataLoadedCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.dataErrorCallback(error, dataStatus));
  }

  private dataLoadedCallback() {
    this.healthCheck = this.dataStore.getHealthCheck("resource");
  }

  private dataErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.healthChecksStatus = error.status;
  }

}


