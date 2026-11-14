import {of} from 'rxjs';
import {ReportRefresh} from '../../../shared/util/report-refresh';
import {RedisQueueCountsService} from '../../../../services/load-data/redis-queue-counts.service';
import {loadFailure} from '../../../shared/util/load-failure';
import {Component, OnInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from "../../../shared/components/base/cedar-page-component.component";
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
  {position: 3, name: 'Clone Instances', value: 0, processing: 0, deadLetter: 0},
];

@Component({
  selector: 'app-queue-counts',
  templateUrl: './queue-counts.component.html',
  styleUrls: ['./queue-counts.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class QueueCountsComponent extends CedarPageComponent implements OnInit, OnDestroy {

  public redisQueueCounts: RedisQueueCounts | undefined;

  displayedColumns: string[] = ['position', 'name', 'value', 'processing', 'deadLetter'];
  dataSource = REPORT.map(row => ({...row}));

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService,
    private queueService: RedisQueueCountsService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  /** Why the report could not be loaded, when it could not. */
  public error: string | null = null;

  readonly refresh = new ReportRefresh(2000, () => {
    this.queueService.reset();
    return this.queueService.getRedisQueueCounts() ?? of(null);
  }, counts => {
    this.error = null;
    this.redisQueueCounts = Object.assign(new RedisQueueCounts(), counts);
    this.updateIdReportTable();
  }, error => {
    this.error = loadFailure('the queue counts', error);
  }, loading => loading ? this.dataHandler.spinner.show() : this.dataHandler.spinner.hide());

  override ngOnInit() {
    super.ngOnInit();
    this.refresh.reload();
  }

  ngOnDestroy(): void {
    this.refresh.destroy();
  }

  private updateIdReportTable() {
    if (this.redisQueueCounts) {
      const counts = this.redisQueueCounts;
      this.dataSource[0].value = counts.appLog;
      this.dataSource[0].processing = counts.appLogProcessing;
      this.dataSource[0].deadLetter = counts.appLogDeadLetter;
      this.dataSource[1].value = counts.searchPermission;
      this.dataSource[1].processing = counts.searchPermissionProcessing;
      this.dataSource[1].deadLetter = counts.searchPermissionDeadLetter;
      this.dataSource[2].value = counts.cloneInstances;
      this.dataSource[2].processing = counts.cloneInstancesProcessing;
      this.dataSource[2].deadLetter = counts.cloneInstancesDeadLetter;
    }
  }
}
