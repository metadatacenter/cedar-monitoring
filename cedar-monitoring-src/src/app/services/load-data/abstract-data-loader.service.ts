import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {RestApiUrlService} from '../rest-api-url.service';

export abstract class AbstractDataLoaderService {

  protected constructor(
    protected http: HttpClient,
    protected restApiUrl: RestApiUrlService,
    protected router: Router,
    protected translateService: TranslateService
  ) {
  }
}
