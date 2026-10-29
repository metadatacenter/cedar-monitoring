import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
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
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, translateService);
  }

  getResourceReportUser(resourceId: string): Observable<ResourceReportUser | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportUser(resourceId));
  }
}
