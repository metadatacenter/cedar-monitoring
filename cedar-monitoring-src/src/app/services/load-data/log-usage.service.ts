import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {CypherStat, EndpointStat, Insights, UsageSummary, UserStat} from '../../shared/model/log-usage.model';

/**
 * Reads the aggregated log data from cedar-monitor-server /logs/usage/*.
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

  endpoints(from: string, to: string, limit: number): Observable<EndpointStat[]> {
    return this.http.get<EndpointStat[]>(this.restApiUrl.logsUsageEndpoints(from, to, limit));
  }

  cypher(from: string, to: string, limit: number): Observable<CypherStat[]> {
    return this.http.get<CypherStat[]>(this.restApiUrl.logsUsageCypher(from, to, limit));
  }

  users(from: string, to: string, limit: number): Observable<UserStat[]> {
    return this.http.get<UserStat[]>(this.restApiUrl.logsUsageUsers(from, to, limit));
  }

  insights(from: string, to: string): Observable<Insights> {
    return this.http.get<Insights>(this.restApiUrl.logsUsageInsights(from, to));
  }
}
