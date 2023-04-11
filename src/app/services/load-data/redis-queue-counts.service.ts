import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportInstance} from "../../shared/model/resource-report-instance.model";
import {RedisQueueCounts} from "../../shared/model/redis-queue-counts.model";
import {GenericSingleLoaderService} from "./generic-single-loader";

@Injectable({
  providedIn: 'root'
})
export class RedisQueueCountsService extends GenericSingleLoaderService<RedisQueueCounts> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getRedisQueueCounts(): Observable<RedisQueueCounts | null> | null {
    return this.getData(this.restApiUrl.redisQueueCounts());
  }
}
