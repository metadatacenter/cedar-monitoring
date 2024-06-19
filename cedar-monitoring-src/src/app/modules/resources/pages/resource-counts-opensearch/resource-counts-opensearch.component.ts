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
import {ResourceCountsOpensearchIndex} from "../../../../shared/model/resource-counts-opensearch-index.model";

export interface ReportRow {
  position: number;
  name: string;
  searchIndex: string;
  recommenderIndex: string;
}

const REPORT: ReportRow[] = [
  {position: 3, name: 'Fields', searchIndex: '', recommenderIndex: ''},
  {position: 4, name: 'Element', searchIndex: '', recommenderIndex: ''},
  {position: 5, name: 'Templates', searchIndex: '', recommenderIndex: ''},
  {position: 6, name: 'Instances', searchIndex: '', recommenderIndex: ''},
  {position: 7, name: 'Folders', searchIndex: '', recommenderIndex: ''},
  {position: 8, name: 'Total', searchIndex: '', recommenderIndex: ''},
];

@Component({
  selector: 'app-resource-counts-opensearch',
  templateUrl: './resource-counts-opensearch.component.html',
  styleUrls: ['./resource-counts-opensearch.component.scss']
})
export class ResourceCountsOpensearchComponent extends CedarPageComponent implements OnInit {

  public resourceCounts: ResourceCountsOpensearchIndex | undefined;
  private resourceCountsStatus: number = 0;

  displayedColumns: string[] = ['position', 'name', 'searchIndex', 'recommenderIndex'];
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
      .require(DataHandlerDataId.RESOURCE_COUNTS_OPENSEARCH)
      .load(() => this.resourceCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.resourceCountsErrorCallback(error, dataStatus));
  }

  private resourceCallback() {
    this.resourceCounts = this.dataStore.getResourceCountsOpensearch();
    this.updateIdReportTable();
  }

  private resourceCountsErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.resourceCountsStatus = error.status;
    this.updateIdReportTable();
  }

  private updateIdReportTable() {
    if (this.resourceCounts) {

      REPORT[0].searchIndex = '' + this.resourceCounts.opensearch.field;
      REPORT[1].searchIndex = '' + this.resourceCounts.opensearch.element;
      REPORT[2].searchIndex = '' + this.resourceCounts.opensearch.template;
      REPORT[3].searchIndex = '' + this.resourceCounts.opensearch.instance;
      REPORT[4].searchIndex = '' + this.resourceCounts.opensearch.folder;
      REPORT[5].searchIndex = '' + this.resourceCounts.opensearch.artifactTotal;
      REPORT[5].recommenderIndex = '' + this.resourceCounts.opensearch.recommenderTotal;

    }
  }
}
