import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportUser} from "../../shared/model/resource-report-user.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceReportUserService extends GenericMultiLoaderService<ResourceReportUser> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getResourceReportUser(resourceId: string): Observable<ResourceReportUser | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportUser(resourceId));
  }
}
