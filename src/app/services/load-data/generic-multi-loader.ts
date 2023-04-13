import {Injectable} from '@angular/core';
import {tap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {AbstractDataLoaderService} from './abstract-data-loader.service';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class GenericMultiLoaderService<T> extends AbstractDataLoaderService {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  protected data: Map<string, T> = new Map<string, T>();
  protected observable: Map<string, Observable<T>> = new Map<string, Observable<T>>();

  getData(id: string, url: string): Observable<T | null> | null {
    if (this.data.get(id)) {
      return of(this.data.get(id) ?? null);
    } else if (this.observable.get(id)) {
      return this.observable.get(id) ?? null;
    } else {
      this.observable.set(id, this.http.get<T>(url)
        .pipe(
          tap(data => {
            this.data.set(id, data);
            return this.log('fetched data');
          })
        ));
      return this.observable.get(id) ?? null;
    }
  }

  public reset() {
    this.data = new Map<string, T>();
    this.observable = new Map<string, Observable<T>>();
  }
}
