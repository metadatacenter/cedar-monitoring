import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {CypherRowPage, RequestRowPage} from '../../shared/model/log-explorer.model';

/**
 * Reads raw log rows from cedar-monitor-server /logs/explorer/* (MONITOR_READ-gated), one page at a time in
 * CEDAR's body envelope. The raw logs stop counting at a ceiling and then report countCapped.
 */
@Injectable({
  providedIn: 'root'
})
export class LogExplorerService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  requests(q: string, minDurationMs: number, limit: number, offset = 0): Observable<RequestRowPage> {
    return this.http.get<RequestRowPage>(this.restApiUrl.logsExplorerRequests(q, minDurationMs, limit, offset));
  }

  cypher(q: string, minDurationMs: number, limit: number, offset = 0): Observable<CypherRowPage> {
    return this.http.get<CypherRowPage>(this.restApiUrl.logsExplorerCypher(q, minDurationMs, limit, offset));
  }
}
