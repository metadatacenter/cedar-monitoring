import {Component, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SnotifyService} from 'ng-alt-snotify';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, NavigationExtras, Router, UrlTree} from '@angular/router';
import {LocalSettingsService} from '../../../../services/local-settings.service';
import {DataStoreService} from '../../../../services/data-store.service';
import {DataHandlerService} from '../../../../services/data-handler.service';

@Component({
  template: ''
})
export abstract class CedarBase implements OnInit {

  protected localSettings: LocalSettingsService;
  protected translateService: TranslateService;
  protected notify: SnotifyService;
  protected datePipe: DatePipe;
  protected router: Router;
  protected route: ActivatedRoute;
  protected dataStore: DataStoreService;
  protected dataHandler: DataHandlerService;

  protected constructor(
    localSettings: LocalSettingsService,
    translateService: TranslateService,
    notify: SnotifyService,
    router: Router,
    route: ActivatedRoute,
    dataStore: DataStoreService,
    dataHandler: DataHandlerService
  ) {
    this.localSettings = localSettings;
    this.translateService = translateService;
    this.notify = notify;
    this.router = router;
    this.route = route;
    this.dataStore = dataStore;
    this.dataHandler = dataHandler;
    this.datePipe = new DatePipe('en-US');
  }

  abstract ngOnInit(): void;

  public notifyError(errorKey: string) {
    if (errorKey === undefined) {
      errorKey = 'generic.error';
    }
    this.notify.error(
      this.translateService.instant(errorKey),
      {
        animation: {
          enter: 'fadeIn',
          exit: 'fadeOut',
          time: 400,
        }
      }
    );
  }

  public notifySuccess(successKey: string) {
    this.notify.success(this.translateService.instant(successKey));
  }

  protected scrollToTop(): void {
    setTimeout(() => {
      const id = '#top';
      const x = document.querySelector(id);
      if (x) {
        x.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
      }
    });
  }

  protected scrollToFragmentId() {
    this.route.fragment.subscribe(fragment => {
      setTimeout(() => {
        const element = document.querySelector('#' + fragment);
        if (element) {
          // element.scrollIntoView();
          element.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
        }
      });
    });
  }

  protected scrollToId(elementId: string) {
    const element = document.querySelector('#' + elementId);
    if (element) {
      // element.scrollIntoView();
      element.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
    }
  }

  public formatLongDate(date: Date) {
    if (date == null) {
      return '';
    }
    return this.datePipe.transform(date, this.translateService.instant('Format.LongDate'));
  }

  public formatLongDateNoSeconds(date: Date) {
    if (date == null) {
      return '';
    }
    return this.datePipe.transform(date, this.translateService.instant('Format.LongDateNoSeconds'));
  }

  public formatShortDate(date: Date) {
    if (date == null) {
      return '';
    }
    return this.datePipe.transform(date, this.translateService.instant('Format.ShortDate'));
  }

  protected navigateByUrlDone(url: string | UrlTree, extras?: NavigationExtras): void {
    //console.log('NavigateByUrl:' + url);
    this.router.navigateByUrl(url, extras).then(_ => {
    });
  }

  protected navigateByUrlThen(url: string | UrlTree, extras?: NavigationExtras): Promise<boolean> {
    //console.log('NavigateByUrlThen:' + url);
    return this.router.navigateByUrl(url, extras);
  }

}
