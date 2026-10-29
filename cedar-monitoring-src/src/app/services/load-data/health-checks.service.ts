import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RestApiUrlService} from '../rest-api-url.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {GenericMultiLoaderService} from "./generic-multi-loader";
import {HealthCheck} from "../../shared/model/health-check.model";

@Injectable({
  providedIn: 'root'
})
export class HealthChecksService extends GenericMultiLoaderService<HealthCheck> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, translateService);
  }

  getHealthCheck(server: string): Observable<HealthCheck | null> | null {
    return this.getData(server, this.restApiUrl.healthCheck(server));
  }
}
