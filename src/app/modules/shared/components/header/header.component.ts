import {Component, Input, OnInit} from '@angular/core';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {AppConfigService} from '../../../../services/app-config.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarBase} from "../base/cedar-base.component";
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends CedarBase implements OnInit {

  @Input()
  title: string = '';

  override ngOnInit() {
  }

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

  openCEDARPage() {
    this.uiService.openUrlInBlank(environment.cedarUrl);
  }

  openLogout() {
    this.keycloak.logout(environment.appUrl);
  }
}
