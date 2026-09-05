import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {SnotifyModule, SnotifyService, ToastDefaults} from "ng-alt-snotify";
import {SharedModule} from "./modules/shared";
import {ResourcesModule} from "./modules/resources/resources.module";
import {MaterialModule} from "./modules/material-module";
import {provideHttpClient, withInterceptorsFromDi, withXhr} from "@angular/common/http";
import {TranslateModule} from "@ngx-translate/core";
import {AppConfigService} from "./services/app-config.service";
import {provideTranslateHttpLoader} from "@ngx-translate/http-loader";
import {initializeKeycloak} from "./init/keycloak-init.factory";
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";


const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
  };
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SnotifyModule,
    SharedModule,
    ResourcesModule,
    MaterialModule,
    KeycloakAngularModule,
    TranslateModule.forRoot(),
  ],
  providers: [
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideTranslateHttpLoader(),
    SnotifyService,
    {
      provide: 'SnotifyToastConfig',
      useValue: ToastDefaults
    },
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
