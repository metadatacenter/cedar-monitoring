import {Component, Input, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';
import {CedarBase} from '../base/cedar-base.component';
import {KeycloakService} from "keycloak-angular";
import {UiService} from "../../../../services/ui.service";

@Component({
  selector: 'app-json-view',
  templateUrl: './json-view.component.html',
  styleUrls: ['./json-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class JsonViewComponent extends CedarBase implements OnInit {

  @Input() inputObject: any;
  @Input() icon: string = 'document';
  @Input() title: string = '';
  @Input() subtitle: string = '';

  constructor(
    translateService: TranslateService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService,
    keycloak: KeycloakService,
    uiService: UiService
  ) {
    super(translateService, router, route, dataStore, dataHandler, keycloak, uiService);
  }

  ngOnInit() {
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
