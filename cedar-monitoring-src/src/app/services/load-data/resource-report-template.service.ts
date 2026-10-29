import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
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
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, translateService);
  }

  getResourceReportTemplate(resourceId: string): Observable<ResourceReportTemplate | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportTemplate(resourceId));
  }
}
