import {of, Subscription} from 'rxjs';
import {ReportRefresh} from '../../../shared/util/report-refresh';
import {loadFailure} from '../../../shared/util/load-failure';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from "../../../shared/components/base/cedar-page-component.component";
import {IndexJobStatus, SearchIndexJobStatus} from "../../../../shared/model/search-index-job-status.model";
import {SearchIndexService} from "../../../../services/load-data/search-index.service";

/**
 * Starting a search index rebuild, and watching one that is running.
 *
 * <p>A full rebuild runs for as long as the repository requires — hours, on a large one — and until
 * this page existed the only way to start it was a shell on the application server, after which the
 * only account of its progress was in a log file. That is the whole reason for this: somewhere to
 * start it, and somewhere to see that it is advancing rather than wedged.
 */
@Component({
  selector: 'app-search-index',
  templateUrl: './search-index.component.html',
  styleUrls: ['./search-index.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SearchIndexComponent extends CedarPageComponent implements OnInit, OnDestroy {

  public jobStatus: SearchIndexJobStatus | undefined;
  public starting = false;
  public startError: string | null = null;

  private rebuildRequest: Subscription | null = null;
  private awaitingRebuildResponse = false;

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService,
    private searchIndexService: SearchIndexService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  /** Why the job status could not be read, while it cannot. */
  public error: string | null = null;
  readonly refresh = new ReportRefresh(3000, () => {
    this.searchIndexService.reset();
    return this.searchIndexService.getSearchIndexJobStatus() ?? of(null);
  }, status => {
    this.error = null;
    this.jobStatus = Object.assign(new SearchIndexJobStatus(), status);
    if (!this.awaitingRebuildResponse) this.starting = false;
  }, error => {
    this.error = loadFailure('the search index status', error);
    if (!this.awaitingRebuildResponse) this.starting = false;
  }, loading => loading ? this.dataHandler.spinner.show() : this.dataHandler.spinner.hide());

  override ngOnInit() {
    super.ngOnInit();
    this.refresh.reload();
  }

  ngOnDestroy() {
    this.refresh.destroy();
    this.rebuildRequest?.unsubscribe();
  }

  get search(): IndexJobStatus | null {
    return this.jobStatus?.SEARCH ?? null;
  }

  get isRunning(): boolean {
    return this.search?.state === 'RUNNING';
  }

  /**
   * A rebuild can be started whenever one is not already running. Whether this user may start it is
   * not decided here: the resource server answers that, and a refusal arrives as the error below.
   */
  get canStart(): boolean {
    return !this.isRunning && !this.starting;
  }

  startRebuild() {
    if (!this.canStart) {
      return;
    }
    this.starting = true;
    this.awaitingRebuildResponse = true;
    this.startError = null;
    this.rebuildRequest = this.searchIndexService.regenerate().subscribe({
      next: () => {
        this.awaitingRebuildResponse = false;
        // Stays disabled until the refreshed status arrives and says what is running.
        this.refresh.reload();
      },
      error: (error: any) => {
        this.awaitingRebuildResponse = false;
        this.starting = false;
        this.startError = this.describeStartFailure(error);
      }
    });
  }

  /**
   * Say what actually happened. The three answers a caller gets here are different questions, and
   * collapsing them into "could not start" would hide the only one that is about them.
   */
  private describeStartFailure(error: any): string {
    const status = error?.status;
    if (status === 403) {
      return 'You do not have permission to rebuild the search index. This needs the search reindex role.';
    }
    if (status === 401) {
      return 'Your session is not valid. Sign in again.';
    }
    if (status === 409) {
      return 'A rebuild is already running over this index.';
    }
    const message = error?.error?.message;
    return message ? String(message) : 'The rebuild could not be started.';
  }

  /** Types the work list holds, so the table renders only rows that mean something. */
  get progressTypes(): string[] {
    const totals = this.search?.progress?.totalByType;
    return totals ? Object.keys(totals) : [];
  }

  processedOfType(type: string): number {
    return this.search?.progress?.processedByType?.[type] ?? 0;
  }

  totalOfType(type: string): number {
    return this.search?.progress?.totalByType?.[type] ?? 0;
  }

  /** A duration a person can read, rather than a count of seconds. */
  formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) {
      return '—';
    }
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  formatTimestamp(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleString() : '—';
  }

  /**
   * The bar only means something once the phase knows its denominator. A total of -1 says it does
   * not yet, and showing 0% then would report a stall that is not happening.
   */
  get percent(): number | null {
    const p = this.search?.progress;
    if (!p || p.total <= 0) {
      return null;
    }
    return p.percentComplete ?? null;
  }

  /** Null means not measured yet, which is not the same as no progress. */
  get rateText(): string {
    const rate = this.search?.progress?.unitsPerSecond;
    if (rate === null || rate === undefined) {
      return 'not measured yet';
    }
    return `${rate.toFixed(1)}/s`;
  }

  get stateClass(): string {
    switch (this.search?.state) {
      case 'RUNNING': return 'state-running';
      case 'COMPLETE': return 'state-complete';
      case 'FAILED': return 'state-failed';
      case 'INTERRUPTED': return 'state-interrupted';
      case 'ABANDONED': return 'state-failed';
      default: return 'state-idle';
    }
  }
}
