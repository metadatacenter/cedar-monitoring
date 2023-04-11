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
import {ResourceCounts} from "../../../../shared/model/resource-counts.model";

export interface ReportRow {
  position: number;
  name: string;
  neo4j: number;
  mongo: string;
  opensearch: string;
  keycloak: string;
}

const REPORT: ReportRow[] = [
  {position: 1, name: 'Users', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 2, name: 'Groups', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 3, name: 'Fields', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 4, name: 'Element', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 5, name: 'Templates', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 6, name: 'Instances', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 7, name: 'Folders', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
  {position: 8, name: 'Categories', neo4j: 0, mongo: '', opensearch: '', keycloak: ''},
];

@Component({
  selector: 'app-resource-counts',
  templateUrl: './resource-counts.component.html',
  styleUrls: ['./resource-counts.component.scss']
})
export class ResourceCountsComponent extends CedarPageComponent implements OnInit {

  public resourceCounts: ResourceCounts | undefined;
  private resourceCountsStatus: number = 0;

  displayedColumns: string[] = ['position', 'name', 'neo4j', 'mongo', 'opensearch', 'keycloak'];
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
      REPORT[7].neo4j = this.resourceCounts.neo4j.category;

      REPORT[2].mongo = '' + this.resourceCounts.mongo.field;
      REPORT[3].mongo = '' + this.resourceCounts.mongo.element;
      REPORT[4].mongo = '' + this.resourceCounts.mongo.template;
      REPORT[5].mongo = '' + this.resourceCounts.mongo.instance;

      REPORT[2].opensearch = '' + this.resourceCounts.opensearch.field;
      REPORT[3].opensearch = '' + this.resourceCounts.opensearch.element;
      REPORT[4].opensearch = '' + this.resourceCounts.opensearch.template;
      REPORT[5].opensearch = '' + this.resourceCounts.opensearch.instance;
      REPORT[6].opensearch = '' + this.resourceCounts.opensearch.folder;

    }
  }
}
