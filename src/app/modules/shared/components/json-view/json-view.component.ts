import {Component, Input, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {CedarBase} from '../base/cedar-base.component';
import {KeycloakService} from "keycloak-angular";
import {AppConfigService} from "../../../../services/app-config.service";
import {UiService} from "../../../../services/ui.service";

@Component({
  selector: 'app-json-view',
  templateUrl: './json-view.component.html',
  styleUrls: ['./json-view.component.scss']
})
export class JsonViewComponent extends CedarBase implements OnInit {

  @Input() inputObject: any;
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';

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

  ngOnInit() {
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
