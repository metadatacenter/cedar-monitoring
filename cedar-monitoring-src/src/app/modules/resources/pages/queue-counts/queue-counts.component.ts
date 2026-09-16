import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
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
  processing: number;
  deadLetter: number;
}

const REPORT: ReportRow[] = [
  {position: 1, name: 'App Log', value: 0, processing: 0, deadLetter: 0},
  {position: 2, name: 'Search Permission', value: 0, processing: 0, deadLetter: 0},
  {position: 3, name: 'NCBI Submission', value: 0, processing: 0, deadLetter: 0},
  {position: 4, name: 'Value Recommender', value: 0, processing: 0, deadLetter: 0},
  {position: 5, name: 'Clone Instances', value: 0, processing: 0, deadLetter: 0},
];

@Component({
  selector: 'app-queue-counts',
  templateUrl: './queue-counts.component.html',
  styleUrls: ['./queue-counts.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class QueueCountsComponent extends CedarPageComponent implements OnInit {

  public redisQueueCounts: RedisQueueCounts | undefined;
  private redisQueueCountsStatus: number = 0;

  displayedColumns: string[] = ['position', 'name', 'value', 'processing', 'deadLetter'];
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
      const counts = this.redisQueueCounts;
      REPORT[0].value = counts.appLog;
      REPORT[0].processing = counts.appLogProcessing;
      REPORT[0].deadLetter = counts.appLogDeadLetter;
      REPORT[1].value = counts.searchPermission;
      REPORT[1].processing = counts.searchPermissionProcessing;
      REPORT[1].deadLetter = counts.searchPermissionDeadLetter;
      REPORT[2].value = counts.ncbiSubmission;
      REPORT[2].processing = counts.ncbiSubmissionProcessing;
      REPORT[2].deadLetter = counts.ncbiSubmissionDeadLetter;
      REPORT[3].value = counts.valuerecommender;
      REPORT[3].processing = counts.valuerecommenderProcessing;
      REPORT[3].deadLetter = counts.valuerecommenderDeadLetter;
      REPORT[4].value = counts.cloneInstances;
      REPORT[4].processing = counts.cloneInstancesProcessing;
      REPORT[4].deadLetter = counts.cloneInstancesDeadLetter;
    }
    this.uiService.redisQueueCountTimeout = setTimeout(() => {
      this.ngOnInit();
    }, 2000);
  }
}
