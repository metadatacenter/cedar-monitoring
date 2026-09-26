import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {
  CypherStatPage,
  EndpointStatPage,
  Insights,
  UsageSummary,
  UserStatPage
} from '../../shared/model/log-usage.model';

/**
 * Reads the aggregated log data from cedar-monitor-server /logs/usage/*. The breakdowns answer one page
 * in CEDAR's body envelope; follow its paging links, or pass an offset, for the rest.
 * The keycloak-angular bearer interceptor attaches the auth token; the endpoints are MONITOR_READ-gated.
 */
@Injectable({
  providedIn: 'root'
})
export class LogUsageService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  summary(from: string, to: string): Observable<UsageSummary> {
    return this.http.get<UsageSummary>(this.restApiUrl.logsUsageSummary(from, to));
  }

  endpoints(from: string, to: string, limit: number, offset = 0): Observable<EndpointStatPage> {
    return this.http.get<EndpointStatPage>(this.restApiUrl.logsUsageEndpoints(from, to, limit, offset));
  }

  cypher(from: string, to: string, limit: number, offset = 0): Observable<CypherStatPage> {
    return this.http.get<CypherStatPage>(this.restApiUrl.logsUsageCypher(from, to, limit, offset));
  }

  users(from: string, to: string, limit: number, offset = 0): Observable<UserStatPage> {
    return this.http.get<UserStatPage>(this.restApiUrl.logsUsageUsers(from, to, limit, offset));
  }

  insights(from: string, to: string): Observable<Insights> {
    return this.http.get<Insights>(this.restApiUrl.logsUsageInsights(from, to));
  }
}
