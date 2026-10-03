import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from "../../../shared/components/base/cedar-page-component.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ProfileComponent extends CedarPageComponent implements OnInit {

  constructor(
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService
  ) {
    super(translateService, notify, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  override ngOnInit() {
    super.ngOnInit();
  }
}
