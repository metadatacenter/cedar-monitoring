import {Component, OnInit} from '@angular/core';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {AppConfigService} from '../../../../services/app-config.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from "../../../shared/components/base/cedar-page-component.component";
import {DataHandlerDataId} from "../../../shared/model/data-handler-data-id.model";
import {DataHandlerDataStatus} from "../../../shared/model/data-handler-data-status.model";
import {RedisQueueCounts} from "../../../../shared/model/redis-queue-counts.model";

export interface ReportRow {
  position: number;
  name: string;
  value: number;
}

const REPORT: ReportRow[] = [
  {position: 1, name: 'App Log', value: 0},
  {position: 2, name: 'Search Permission', value: 0},
  {position: 3, name: 'NCBI Submission', value: 0},
  {position: 4, name: 'Value Recommender', value: 0},
];

@Component({
  selector: 'app-queue-counts',
  templateUrl: './queue-counts.component.html',
  styleUrls: ['./queue-counts.component.scss']
})
export class QueueCountsComponent extends CedarPageComponent implements OnInit {

  public redisQueueCounts: RedisQueueCounts | undefined;
  private redisQueueCountsStatus: number = 0;

  displayedColumns: string[] = ['position', 'name', 'value'];
  dataSource = REPORT;

  constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService,
    private configService: AppConfigService,
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.initDataHandler();
    this.dataHandler.reset();
    this.dataHandler
      .require(DataHandlerDataId.REDIS_QUEUE_COUNTS)
      .load(() => this.queueCountsCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.queueCountsErrorCallback(error, dataStatus));
  }

  private queueCountsCallback() {
    this.redisQueueCounts = this.dataStore.getRedisQueueCounts();
    this.updateIdReportTable();
  }

  private queueCountsErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.redisQueueCountsStatus = error.status;
    this.updateIdReportTable();
  }

  private updateIdReportTable() {
    if (this.redisQueueCounts) {
      REPORT[0].value = this.redisQueueCounts.appLog;
      REPORT[1].value = this.redisQueueCounts.searchPermission;
      REPORT[2].value = this.redisQueueCounts.ncbiSubmission;
      REPORT[3].value = this.redisQueueCounts.valuerecommender;
    }
    this.uiService.redisQueueCountTimeout = setTimeout(() => {
      this.ngOnInit();
    }, 2000);
  }
}
