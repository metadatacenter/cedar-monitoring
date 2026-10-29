import {loadFailure} from '../../../shared/util/load-failure';
import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from "../../../shared/components/base/cedar-page-component.component";
import {DataHandlerDataId} from "../../../shared/model/data-handler-data-id.model";
import {ResourceCountsOpensearchIndex} from "../../../../shared/model/resource-counts-opensearch-index.model";

export interface ReportRow {
  position: number;
  name: string;
  searchIndex: string;
}

const REPORT: ReportRow[] = [
  {position: 3, name: 'Fields', searchIndex: ''},
  {position: 4, name: 'Element', searchIndex: ''},
  {position: 5, name: 'Templates', searchIndex: ''},
  {position: 6, name: 'Instances', searchIndex: ''},
  {position: 7, name: 'Folders', searchIndex: ''},
  {position: 8, name: 'Total', searchIndex: ''},
];

@Component({
  selector: 'app-resource-counts-opensearch',
  templateUrl: './resource-counts-opensearch.component.html',
  styleUrls: ['./resource-counts-opensearch.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ResourceCountsOpensearchComponent extends CedarPageComponent implements OnInit {

  public resourceCounts: ResourceCountsOpensearchIndex | undefined;

  displayedColumns: string[] = ['position', 'name', 'searchIndex'];
  dataSource = REPORT;

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  /** Why the report could not be loaded, when it could not. */
  public error: string | null = null;

  override ngOnInit() {
    super.ngOnInit();
    this.initDataHandler();
    this.dataHandler.reset();
    this.dataHandler
      .require(DataHandlerDataId.RESOURCE_COUNTS_OPENSEARCH)
      .load(() => this.resourceCallback(), (error: unknown) => this.resourceCountsErrorCallback(error));
  }

  private resourceCallback() {
    // The data handler calls this once every request has settled, failed ones included.
    if (this.error) return;
    this.resourceCounts = this.dataStore.getResourceCountsOpensearch();
    this.updateIdReportTable();
  }

  private resourceCountsErrorCallback(error: unknown) {
    this.error = loadFailure('the index counts', error);
  }

  private updateIdReportTable() {
    if (this.resourceCounts) {

      REPORT[0].searchIndex = '' + this.resourceCounts.opensearch.field;
      REPORT[1].searchIndex = '' + this.resourceCounts.opensearch.element;
      REPORT[2].searchIndex = '' + this.resourceCounts.opensearch.template;
      REPORT[3].searchIndex = '' + this.resourceCounts.opensearch.instance;
      REPORT[4].searchIndex = '' + this.resourceCounts.opensearch.folder;
      REPORT[5].searchIndex = '' + this.resourceCounts.opensearch.artifactTotal;

    }
  }
}
