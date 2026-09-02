import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericSingleLoaderService} from "./generic-single-loader";
import {MySqlCounts} from "../../shared/model/mysql-counts.model";

@Injectable({
  providedIn: 'root'
})
export class MySqlCountsService extends GenericSingleLoaderService<MySqlCounts> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  /**
   * Load the report. The loader caches its one response, so a caller switching between estimated
   * and exact counts resets it first: the two are the same resource asked a different question.
   */
  getMySqlCounts(exact: boolean = false): Observable<MySqlCounts | null> | null {
    return this.getData(this.restApiUrl.mysqlCounts(exact));
  }
}
