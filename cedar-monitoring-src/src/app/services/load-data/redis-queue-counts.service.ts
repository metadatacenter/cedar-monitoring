import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
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
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, translateService);
  }

  getRedisQueueCounts(): Observable<RedisQueueCounts | null> | null {
    return this.getData(this.restApiUrl.redisQueueCounts());
  }
}
