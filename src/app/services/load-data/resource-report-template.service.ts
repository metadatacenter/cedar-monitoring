import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportTemplate} from "../../shared/model/resource-report-template.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceReportTemplateService extends GenericMultiLoaderService<ResourceReportTemplate> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getResourceReportTemplate(resourceId: string): Observable<ResourceReportTemplate | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportTemplate(resourceId));
  }
}
