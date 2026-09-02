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
import {MySqlCounts} from "../../../../shared/model/mysql-counts.model";
import {MySqlTable} from "../../../../shared/model/mysql-table.model";

@Component({
  selector: 'app-mysql-counts',
  templateUrl: './mysql-counts.component.html',
  styleUrls: ['./mysql-counts.component.scss']
})
export class MySqlCountsComponent extends CedarPageComponent implements OnInit {

  public mySqlCounts: MySqlCounts | undefined;
  public loadStatus: number = 0;
  /** Whether the report on screen counted its rows or estimated them. */
  public exact: boolean = false;

  displayedColumns: string[] = ['name', 'rows', 'data', 'index', 'total', 'free', 'engine', 'updated'];

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
    this.load(false);
  }

  /**
   * Estimated counts are one query per database whatever the row count, so they are what the page
   * opens with. Counting exactly is a full scan of every table, which over the log tables is worth
   * waiting for only when someone asks.
   */
  public load(exact: boolean) {
    this.exact = exact;
    this.mySqlCounts = undefined;
    this.dataHandler.reset();
    this.dataHandler
      .requireId(DataHandlerDataId.MYSQL_COUNTS, exact ? 'exact' : 'approximate')
      .load(() => this.countsCallback(),
        (error: any, dataStatus: DataHandlerDataStatus) => this.countsErrorCallback(error, dataStatus));
  }

  private countsCallback() {
    this.mySqlCounts = this.dataStore.getMySqlCounts();
    this.loadStatus = 0;
  }

  private countsErrorCallback(error: any, dataStatus: DataHandlerDataStatus) {
    this.loadStatus = error.status;
  }

  /** The count to show for a table: the exact one when it was gathered, the estimate otherwise. */
  public rowsOf(table: MySqlTable): string {
    if (table.rowsExact !== null && table.rowsExact !== undefined) {
      return this.formatNumber(table.rowsExact);
    }
    if (table.rowsApproximate === null || table.rowsApproximate === undefined) {
      return '—';
    }
    return '~' + this.formatNumber(table.rowsApproximate);
  }

  public formatNumber(value: number | null): string {
    return value === null || value === undefined ? '—' : value.toLocaleString('en-US');
  }

  /**
   * Bytes at the scale a person reads. MySQL reports these in bytes and a log table runs to
   * hundreds of megabytes, so the raw figure is the one thing nobody wants on screen.
   */
  public formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined) {
      return '—';
    }
    if (bytes === 0) {
      return '0';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let scaled = bytes;
    let unit = 0;
    while (scaled >= 1024 && unit < units.length - 1) {
      scaled /= 1024;
      unit++;
    }
    return `${scaled.toFixed(scaled < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
  }

  public formatTimestamp(value: string | null): string {
    return value ? value.replace('T', ' ').replace('Z', '') : '—';
  }
}
