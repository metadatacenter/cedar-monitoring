import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {SnotifyService} from 'ng-alt-snotify';
import {TranslateService} from '@ngx-translate/core';
import {RestApiUrlService} from '../rest-api-url.service';
import {GenericSingleLoaderService} from "./generic-single-loader";
import {SearchIndexJobStatus} from "../../shared/model/search-index-job-status.model";

/**
 * Reading the state of a search index rebuild, and starting one.
 *
 * <p>Unlike the other pages here, this one also writes. The write adds no authority: the Monitor
 * forwards the caller's own credential, and the resource server decides against the reindex
 * permission it has always required. A user who could not start a rebuild themselves cannot start
 * one from here, and the refusal arrives as a 403 from that server rather than from this page.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchIndexService extends GenericSingleLoaderService<SearchIndexJobStatus> {

  protected constructor(
    http: HttpClient,
    restApiUrl: RestApiUrlService,
    router: Router,
    notify: SnotifyService,
    translateService: TranslateService
  ) {
    super(http, restApiUrl, router, notify, translateService);
  }

  getSearchIndexJobStatus(): Observable<SearchIndexJobStatus | null> | null {
    return this.getData(this.restApiUrl.searchIndexJobStatus());
  }

  /**
   * Queue a rebuild. Answers 202 with the job to poll, or 409 when one is already running, which the
   * page reports rather than swallows: "already running" is the answer to the question asked.
   */
  regenerate(): Observable<any> {
    return this.http.post(this.restApiUrl.searchIndexRegenerate(), {});
  }
}
