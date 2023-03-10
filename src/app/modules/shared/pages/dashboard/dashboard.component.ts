import {CedarPageComponent} from '../../components/base/cedar-page-component.component';
import {Component, OnInit} from '@angular/core';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {AppConfigService} from '../../../../services/app-config.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends CedarPageComponent implements OnInit {

  constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    private configService: AppConfigService
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler);
  }

  ngOnInit() {
    // if (this.configService.appConfig) {
    //   window.location.href = this.configService.appConfig.cedarUrl;
    // }
  }

}
