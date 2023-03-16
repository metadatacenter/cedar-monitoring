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
import {ResourceIdLookup} from "../../../../shared/model/resource-id-lookup.model";
import {ResourceReportUser} from "../../../../shared/model/resource-report-user.model";
import {ResourceReportField} from "../../../../shared/model/resource-report-field.model";

export interface ReportRow {
  position: number;
  name: string;
  value: string;
}

const ID_PARSING_REPORT: ReportRow[] = [
  {position: 1, name: 'success', value: ''},
  {position: 2, name: 'resourceIdSource', value: ''},
  {position: 3, name: 'resourceIdString', value: ''},
  {position: 4, name: 'resourceType', value: ''},
];

@Component({
  selector: 'app-resource-info',
  templateUrl: './resource-info.component.html',
  styleUrls: ['./resource-info.component.scss']
})
export class ResourceInfoComponent extends CedarPageComponent implements OnInit {


  constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    private configService: AppConfigService,
    private uiService: UiService
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler, keycloak);
  }

  //public resourceIdFromPage: string = 'https://metadatacenter.org/users/ab2a9696-291f-4705-b5e6-6c262266c506';
  public resourceIdFromPage: string = 'https://repo.metadatacenter.orgx/template-fields/ce2a9e0f-2e9f-474b-a5ac-fc7cd5dee036';
  //public resourceIdFromPage: string = '';
  public resourceIdToLookUp: string = '';
  public resourceIdLookupMap: Map<string, ResourceIdLookup> = new Map<string, ResourceIdLookup>();
  public resourceIdLookupStatusMap: Map<string, number> = new Map<string, number>();
  public resourceReportStatusMap: Map<string, number> = new Map<string, number>();

  displayedColumns: string[] = ['position', 'name', 'value'];
  dataSource = ID_PARSING_REPORT;

  responseSuccess: boolean | undefined = undefined;
  responseResourceId: string = '';
  responseResourceIdSource: string = '';
  responseResourceType: string = '';

  reportDataUser: ResourceReportUser | undefined;
  reportDataField: ResourceReportField | undefined;

  override ngOnInit() {
    super.ngOnInit();
  }

  lookUpResourceId() {
    this.resourceIdToLookUp = this.resourceIdFromPage;
    this.initDataHandler();
    this.responseSuccess = undefined;
    this.responseResourceId = '';
    this.responseResourceIdSource = '';
    this.responseResourceType = '';
    this.updateIdReportTable();
    this.reportDataUser = undefined;
    this.reportDataField = undefined;
    this.dataHandler
      .requireId(DataHandlerDataId.DETECT_RESOURCE_ID, this.resourceIdToLookUp)
      .load(() => this.resourceIdLookedUpCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.resourceIdLookUpErrorCallback(error, dataStatus));
  }

  private resourceIdLookedUpCallback() {
    const v: any = this.dataStore.getResourceIdLookup(this.resourceIdToLookUp);
    this.responseSuccess = v['success'];
    if (v['resourceIdString']) {
      this.responseResourceId = v['resourceIdString'];
    }
    if (v['resourceIdSource']) {
      this.responseResourceIdSource = v['resourceIdSource'];
    }
    if (v['resourceId']) {
      this.responseResourceType = v['resourceId']['type'];
    }
    this.updateIdReportTable();
    this.dataHandler.reset();

    this.loadResourceReport();
  }

  private updateIdReportTable() {
    ID_PARSING_REPORT[0].value = this.responseSuccess === undefined ? '' : this.responseSuccess ? 'true' : 'false';
    ID_PARSING_REPORT[1].value = this.responseResourceIdSource;
    ID_PARSING_REPORT[2].value = this.responseResourceId;
    ID_PARSING_REPORT[3].value = this.responseResourceType;
  }

  private resourceIdLookUpErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.resourceIdLookupStatusMap.set(dataStatus.id, error.status);
  }

  private loadResourceReport() {
    if (this.responseResourceType == 'user') {
      this.dataHandler
        .requireId(DataHandlerDataId.RESOURCE_REPORT_USER, this.responseResourceId)
        .load(() => this.resourceReportUserCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.resourceReportErrorCallback(error, dataStatus));
    }
    if (this.responseResourceType == 'field') {
      this.dataHandler
        .requireId(DataHandlerDataId.RESOURCE_REPORT_FIELD, this.responseResourceId)
        .load(() => this.resourceReportFieldCallback(), (error: any, dataStatus: DataHandlerDataStatus) => this.resourceReportErrorCallback(error, dataStatus));
    }
  }

  private resourceReportUserCallback() {
    this.reportDataUser = this.dataStore.getResourceReportUser(this.resourceIdToLookUp);
  }

  private resourceReportFieldCallback() {
    this.reportDataField = this.dataStore.getResourceReportField(this.resourceIdToLookUp);
  }

  private resourceReportErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.resourceReportStatusMap.set(dataStatus.id, error.status);
  }
}
