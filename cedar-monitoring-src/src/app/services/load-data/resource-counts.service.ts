import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericSingleLoaderService} from "./generic-single-loader";
import {ResourceCounts} from "../../shared/model/resource-counts.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceCountsService extends GenericSingleLoaderService<ResourceCounts> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getResourceCounts(): Observable<ResourceCounts | null> | null {
    return this.getData(this.restApiUrl.resourceCounts());
  }
}
