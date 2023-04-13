import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {RestApiUrlService} from '../rest-api-url.service';

export abstract class AbstractDataLoaderService {

  protected constructor(
    protected http: HttpClient,
    protected restApiUrl: RestApiUrlService,
    protected router: Router,
    protected notify: SnotifyService,
    protected translateService: TranslateService
  ) {
  }

  protected handleError<T>(operation = 'operation', errorCallback?: Function, result?: T) {
    return (error: any): Observable<T> => {

      console.error(error);

      if (error.error.hasOwnProperty('errorKey')) {
        const ek = error.error.errorKey;
        if (ek === 'resourceNotPublic') {
          this.notifyError(ek);
        }
      }

      this.log(`${operation} failed: ${error.message}`);
      if (errorCallback) {
        errorCallback(error);
      }

      return of(result as T);
    };
  }

  protected log(message: string) {
    // console.log(this.constructor.name + `: ${message}`);
  }

  public notifyError(errorKey: string) {
    if (errorKey === undefined) {
      errorKey = 'generic.error';
    } else {
      errorKey = 'error.' + errorKey;
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
}
