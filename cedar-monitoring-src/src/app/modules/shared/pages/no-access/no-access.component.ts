import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";
import {CedarPageComponent} from '../../components/base/cedar-page-component.component';
import {MonitorAccessService} from "../../../../services/monitor-access.service";

/**
 * Where the guard sends a signed-in user who lacks MONITOR_READ, instead of letting every page fill
 * with 403s that look like outages.
 */
@Component({
  selector: 'app-no-access',
  templateUrl: './no-access.component.html',
  styleUrls: ['./no-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class NoAccessComponent extends CedarPageComponent implements OnInit {

  public checking = false;
  public lastChecked: Date | null = null;

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService,
    private monitorAccess: MonitorAccessService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  async checkAgain() {
    this.checking = true;
    this.monitorAccess.reset();
    const access = await this.monitorAccess.check();
    this.checking = false;
    if (access === 'allowed') {
      void this.router.navigateByUrl('/');
    } else {
      this.lastChecked = new Date();
    }
  }
}
