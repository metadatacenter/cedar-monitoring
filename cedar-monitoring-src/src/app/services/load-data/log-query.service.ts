import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {CoverageResult, FacetResult, LogQuerySpec, QueryResult} from '../../shared/model/log-query.model';

/**
 * The structured query engine — cedar-monitor-server /logs/{query,facets,coverage}, MONITOR_READ-gated
 * (the keycloak-angular bearer interceptor attaches the token).
 *
 * One endpoint answers raw rows, aggregates and pattern queries, so new questions do not need new
 * services. The older LogExplorerService/LogUsageService remain for the fixed-shape pages.
 */
@Injectable({
  providedIn: 'root'
})
export class LogQueryService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  query(spec: LogQuerySpec): Observable<QueryResult> {
    return this.http.post<QueryResult>(this.restApiUrl.logsQuery(), spec);
  }

  /** Distinct values + counts for one dimension, for the filter dropdowns. */
  facet(table: string, column: string, from: string, to: string): Observable<FacetResult> {
    return this.http.get<FacetResult>(this.restApiUrl.logsFacet(table, column, from, to));
  }

  /** What is queryable and what is actually present — drives the caveat line under the controls. */
  coverage(): Observable<CoverageResult> {
    return this.http.get<CoverageResult>(this.restApiUrl.logsCoverage());
  }
}
