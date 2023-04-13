import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportInstance} from "../../shared/model/resource-report-instance.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceReportInstanceService extends GenericMultiLoaderService<ResourceReportInstance> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getResourceReportInstance(instanceId: string): Observable<ResourceReportInstance | null> | null {
    return this.getData(instanceId, this.restApiUrl.resourceReportInstance(instanceId));
  }
}
