import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {CedarBase} from './cedar-base.component';
import {ActivatedRoute, Router} from '@angular/router';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';

export abstract class CedarPageComponent extends CedarBase {

  protected constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService
  ) {
    super(localSettings, translateService, notify, router, route, dataStore, dataHandler);
  }

  protected initDataHandler(): DataHandlerService {
    this.dataHandler.reset();
    this.dataHandler.setPreCallback(() => this.preDataIsLoaded());
    return this.dataHandler;
  }

  private preDataIsLoaded() {
  }
}
