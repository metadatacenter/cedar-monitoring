import {catchError, forkJoin, map, of} from 'rxjs';
import {ReportRefresh} from '../../../shared/util/report-refresh';
import {HealthChecksService} from '../../../../services/load-data/health-checks.service';
import {Component, OnInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CedarPageComponent} from '../../../shared/components/base/cedar-page-component.component';
import {TranslateService} from '@ngx-translate/core';
import {UiService} from '../../../../services/ui.service';
import {HealthCheck} from "../../../../shared/model/health-check.model";
import {MicroservicesService} from "../../../../services/microservices.service";
import {KeycloakService} from "keycloak-angular";
import {accessFromStatus} from "../../../../services/monitor-access.service";

@Component({
  selector: 'app-health-checks',
  templateUrl: './health-checks.component.html',
  styleUrls: ['./health-checks.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class HealthChecksComponent extends CedarPageComponent implements OnInit, OnDestroy {

  public serverNames: string[] = [];
  public healthCheckMap: Map<string, HealthCheck> = new Map<string, HealthCheck>();
  public healthCheckStatusMap: Map<string, number> = new Map<string, number>();
  public nrLoaded: number = 0;
  public nrErrored: number = 0;
  public nrTotal: number = 0;

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService,
    private microservicesService: MicroservicesService,
    private healthChecksService: HealthChecksService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  readonly refresh = new ReportRefresh(5000, () => {
    this.healthChecksService.reset();
    return forkJoin(this.serverNames.map(server =>
      (this.healthChecksService.getHealthCheck(server) ?? of(null)).pipe(
        map(health => ({server, health: Object.assign(new HealthCheck(), health), status: undefined as number | undefined})),
        catchError(error => of({server, health: null, status: Number(error?.status ?? 0)}))
      )));
  }, reports => {
    this.healthCheckMap = new Map();
    this.healthCheckStatusMap = new Map();
    for (const report of reports) {
      if (report.health) this.healthCheckMap.set(report.server, report.health);
      if (report.status !== undefined) this.healthCheckStatusMap.set(report.server, report.status);
    }
    this.nrLoaded = this.healthCheckMap.size;
    this.nrErrored = this.healthCheckStatusMap.size;
  }, () => {}, loading => loading ? this.dataHandler.spinner.show() : this.dataHandler.spinner.hide());

  override ngOnInit() {
    super.ngOnInit();
    this.serverNames = this.microservicesService.getServerNames();
    this.nrTotal = this.serverNames.length;
    this.refresh.reload();
  }

  ngOnDestroy(): void {
    this.refresh.destroy();
  }

  // A refusal is about the caller, not the service: it must not be painted as the service failing.
  private isDenied(status: number | undefined): boolean {
    return status !== undefined && accessFromStatus(status) === 'denied';
  }

  getStatus(serverName: string): string {
    let status = this.healthCheckStatusMap.get(serverName);
    if (this.isDenied(status)) {
      return 'No access (' + status + '), health unknown';
    } else if (status !== undefined) {
      // 0 is the browser's own failure: nothing answered at all.
      return status === 0 ? 'Error: no response' : 'Error: ' + status;
    } else {
      return 'Health check loaded';
    }
  }

  getServerColor(serverName: string) {
    let status = this.healthCheckStatusMap.get(serverName);
    if (this.isDenied(status)) {
      return '';
    } else if (status !== undefined) {
      return 'warn';
    } else {
      return 'primary';
    }
  }
}


