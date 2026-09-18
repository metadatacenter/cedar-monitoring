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
import {ResourceCounts} from "../../../../shared/model/resource-counts.model";
import {DriftStatus, StoreCountDrift} from "../../../../shared/model/store-count-drift.model";

export interface ReportRow {
  position: number;
  name: string;
  neo4j: number;
  mongo: string;
  opensearch: string;
  keycloak: string;
  /**
   * The checks the server ran for this row, worst first. Empty for the rows only one store holds:
   * nothing is comparable, which is not the same as nothing being wrong.
   */
  checks: StoreCountDrift[];
  /**
   * The subset of `checks` that actually checked something, and so has a chip to show. A row whose
   * only entry is `NOT_CHECKED` shows a dash instead - it is a number carried for context, and
   * giving it a chip made it look like a check that had passed.
   */
  chips: StoreCountDrift[];
  /** Why this row has no chips, for the dash to carry on hover. */
  dashTooltip: string;
  /** The worst status among `checks`, or null where there are none. */
  status: DriftStatus | null;
  /**
   * A breakdown of the row above rather than a resource type of its own. Shown indented and
   * without a number: user home folders and system folders are subsets of Folders, and numbering
   * them 9 and 10 beside Users and Templates would invite adding them to the total.
   */
  indent?: boolean;
}

/** Worst first, so a row's summary takes the status of the check that most needs attention. */
const STATUS_SEVERITY: Record<DriftStatus, number> = {
  DRIFT: 4,
  UNAVAILABLE: 3,
  UNVERIFIED: 2,
  OK: 1,
  NOT_CHECKED: 0,
};

/**
 * What a cell says where the store genuinely does not hold this kind of resource.
 *
 * <p>Left blank, those cells read as a count nobody managed to take - which on a page whose whole
 * subject is stores disagreeing is the worst possible ambiguity. Saying which store holds what is
 * also half the explanation for the differences the page reports.
 */
const NOT_STORED = 'not stored';
const NOT_INDEXED = 'not indexed';

/** For a row nothing compares at all, as opposed to one whose number is deliberately unchecked. */
const NOTHING_TO_CHECK = 'Only one store holds this, so there is nothing to check it against.';

const ABSENT_TOOLTIPS: Record<string, string> = {
  [NOT_STORED]: 'The artifact store holds fields, elements, templates and instances. Everything '
    + 'else on this page exists only in the workspace graph, so there is no document to count.',
  [NOT_INDEXED]: 'The search index holds artifacts and the folders a user can browse to. It never '
    + 'holds users, groups, categories, user home folders or system folders.',
};

// Each row starts at what the store would say if it holds nothing of this kind; the load then
// overwrites the cells that have a real count. Keycloak is left blank deliberately: it holds users
// and nothing else on this page, and eight "not stored" chips down that column would be noise.
const REPORT: ReportRow[] = [
  {position: 1, name: 'Users', neo4j: 0, mongo: NOT_STORED, opensearch: NOT_INDEXED, keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 2, name: 'Groups', neo4j: 0, mongo: NOT_STORED, opensearch: NOT_INDEXED, keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 3, name: 'Fields', neo4j: 0, mongo: '', opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 4, name: 'Element', neo4j: 0, mongo: '', opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 5, name: 'Templates', neo4j: 0, mongo: '', opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 6, name: 'Instances', neo4j: 0, mongo: '', opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 7, name: 'Folders', neo4j: 0, mongo: NOT_STORED, opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
  {position: 0, name: 'Regular folders', neo4j: 0, mongo: NOT_STORED, opensearch: '', keycloak: '', checks: [], chips: [], dashTooltip: '', status: null, indent: true},
  {position: 0, name: 'User home folders', neo4j: 0, mongo: NOT_STORED, opensearch: NOT_INDEXED, keycloak: '', checks: [], chips: [], dashTooltip: '', status: null, indent: true},
  {position: 0, name: 'System folders', neo4j: 0, mongo: NOT_STORED, opensearch: NOT_INDEXED, keycloak: '', checks: [], chips: [], dashTooltip: '', status: null, indent: true},
  {position: 8, name: 'Categories', neo4j: 0, mongo: NOT_STORED, opensearch: NOT_INDEXED, keycloak: '', checks: [], chips: [], dashTooltip: '', status: null},
];

@Component({
  selector: 'app-resource-counts',
  templateUrl: './resource-counts.component.html',
  styleUrls: ['./resource-counts.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ResourceCountsComponent extends CedarPageComponent implements OnInit {

  public resourceCounts: ResourceCounts | undefined;
  private resourceCountsStatus: number = 0;

  displayedColumns: string[] = ['position', 'name', 'neo4j', 'mongo', 'opensearch', 'keycloak', 'drift'];
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
      .require(DataHandlerDataId.RESOURCE_COUNTS)
      .load(() => this.resourceCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.resourceCountsErrorCallback(error, dataStatus));
  }

  private resourceCallback() {
    this.resourceCounts = this.dataStore.getResourceCounts();
    this.updateIdReportTable();
  }

  private resourceCountsErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.resourceCountsStatus = error.status;
    this.updateIdReportTable();
  }

  private updateIdReportTable() {
    if (this.resourceCounts) {
      REPORT[0].neo4j = this.resourceCounts.neo4j.user;
      REPORT[1].neo4j = this.resourceCounts.neo4j.group;
      REPORT[2].neo4j = this.resourceCounts.neo4j.field;
      REPORT[3].neo4j = this.resourceCounts.neo4j.element;
      REPORT[4].neo4j = this.resourceCounts.neo4j.template;
      REPORT[5].neo4j = this.resourceCounts.neo4j.instance;
      REPORT[6].neo4j = this.resourceCounts.neo4j.folder;
      // The three parts of the folder row, in the order they expand it: 2374 + 5659 + 2 = 8035.
      REPORT[7].neo4j = this.resourceCounts.neo4j.regularFolder;
      REPORT[7].opensearch = '' + this.resourceCounts.opensearch.folder;
      REPORT[8].neo4j = this.resourceCounts.neo4j.userHomeFolder;
      REPORT[9].neo4j = this.resourceCounts.neo4j.systemFolder;
      REPORT[10].neo4j = this.resourceCounts.neo4j.category;

      REPORT[2].mongo = '' + this.resourceCounts.mongo.field;
      REPORT[3].mongo = '' + this.resourceCounts.mongo.element;
      REPORT[4].mongo = '' + this.resourceCounts.mongo.template;
      REPORT[5].mongo = '' + this.resourceCounts.mongo.instance;

      REPORT[2].opensearch = '' + this.resourceCounts.opensearch.field;
      REPORT[3].opensearch = '' + this.resourceCounts.opensearch.element;
      REPORT[4].opensearch = '' + this.resourceCounts.opensearch.template;
      REPORT[5].opensearch = '' + this.resourceCounts.opensearch.instance;
      REPORT[6].opensearch = '' + this.resourceCounts.opensearch.folder;

      REPORT[0].keycloak = '' + this.resourceCounts.keycloak.user;

      this.applyDrift();
    }
  }

  /**
   * Hangs each check off the row it belongs to.
   *
   * <p>Matched on the check's own `resourceType`, which the server sets to the row name, rather
   * than on a position: the row order here and the check order there are two lists that would
   * otherwise have to be kept in step by hand.
   */
  private applyDrift() {
    const checks = this.resourceCounts?.drift?.checks ?? [];
    for (const row of REPORT) {
      row.checks = checks
        .filter(check => check.resourceType === row.name)
        .sort((a, b) => STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status]);
      row.chips = row.checks.filter(check => check.status !== 'NOT_CHECKED');
      row.status = row.checks.length ? row.checks[0].status : null;
      // A row with a reported-but-unchecked number explains itself; one with nothing to compare
      // says so in general terms.
      const unchecked = row.checks.find(check => check.status === 'NOT_CHECKED');
      row.dashTooltip = unchecked ? unchecked.rule : NOTHING_TO_CHECK;
    }
  }

  get driftingChecks(): number {
    return this.resourceCounts?.drift?.driftingChecks ?? 0;
  }

  get totalChecks(): number {
    return this.resourceCounts?.drift?.totalChecks ?? 0;
  }

  get unverifiedChecks(): number {
    return this.resourceCounts?.drift?.unverifiedChecks ?? 0;
  }

  get unavailableChecks(): number {
    return this.resourceCounts?.drift?.unavailableChecks ?? 0;
  }

  /** The banner's own class, so a page with nothing wrong looks different at a glance from one that has. */
  get summaryClass(): string {
    if (this.driftingChecks > 0 || this.unavailableChecks > 0) {
      return 'drift';
    }
    return this.unverifiedChecks > 0 ? 'unverified' : 'ok';
  }

  /**
   * What one chip says.
   *
   * <p>A signed count carries its sign, because which way a check leans is usually which failure
   * happened. A check with no exact expectation gets a word instead of a number: writing the
   * Keycloak-to-graph gap as a figure in this column would make the one difference nobody can act
   * on look exactly like the ones they can.
   */
  /**
   * The word under a chip whose figure is not a fault.
   *
   * <p>A signed number in a drift column reads as something to go and fix. The Keycloak-to-graph
   * difference is not: it is mostly accounts that have never signed in, and no total can separate
   * those from a provisioning callback that failed. Amber already says "not a clean pass"; this
   * says which kind of not-a-clean-pass it is, in the column rather than only in the tooltip.
   */
  chipCaption(check: StoreCountDrift): string | null {
    return check.status === 'UNVERIFIED' ? 'expected drift' : null;
  }

  /** The whole reasoning behind one check, for the cell's tooltip. */
  checkTooltip(check: StoreCountDrift): string {
    const heading = `${check.compared} ${check.comparedCount}`
      + (check.expected === null || check.expected === undefined ? '' : `, expected ${check.expected}`)
      + ` (${check.authority} ${check.authorityCount})`
      + (check.drift !== null && check.drift !== undefined && check.drift !== check.gap
        ? `\nWhole difference ${check.gap}, of which ${check.drift} unexplained.` : '');
    return check.note ? `${heading}\n\n${check.rule}\n\n${check.note}` : `${heading}\n\n${check.rule}`;
  }

  statusClass(status: DriftStatus | null): string {
    return status === null ? 'none' : status.toLowerCase().replace('_', '-');
  }

  /** A store column's cell is a placeholder, not a number, where that store holds nothing of the kind. */
  isAbsent(value: string): boolean {
    return value === NOT_STORED || value === NOT_INDEXED;
  }

  absentTooltip(value: string): string {
    return ABSENT_TOOLTIPS[value] ?? '';
  }
}
