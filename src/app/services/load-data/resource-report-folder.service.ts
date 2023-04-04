import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/index';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {ResourceReportUser} from "../../shared/model/resource-report-user.model";
import {ResourceReportFolder} from "../../shared/model/resource-report-folder.model";

@Injectable({
  providedIn: 'root'
})
export class ResourceReportFolderService extends GenericMultiLoaderService<ResourceReportFolder> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getResourceReportFolder(resourceId: string): Observable<ResourceReportFolder | null> | null {
    return this.getData(resourceId, this.restApiUrl.resourceReportFolder(resourceId));
  }
}
