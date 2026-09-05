import {platformBrowser} from '@angular/platform-browser';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {enableProdMode, provideZoneChangeDetection} from "@angular/core";

if (environment.production) {
  enableProdMode();
}

platformBrowser().bootstrapModule(AppModule, {applicationProviders: [provideZoneChangeDetection()]})
  .catch(err => console.error(err));
