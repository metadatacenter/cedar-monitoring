import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportElement} from "../../shared/model/resource-report-element.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceReportElementService extends GenericMultiLoaderService<ResourceReportElement> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, translateService);
  }

  getResourceReportElement(resourceId: string): Observable<ResourceReportElement | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportElement(resourceId));
  }
}
