import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {CypherRow, RequestRow} from '../../shared/model/log-explorer.model';

/** Reads raw log rows from cedar-monitor-server /logs/explorer/* (MONITOR_READ-gated). */
@Injectable({
  providedIn: 'root'
})
export class LogExplorerService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  requests(q: string, minDurationMs: number, limit: number): Observable<RequestRow[]> {
    return this.http.get<RequestRow[]>(this.restApiUrl.logsExplorerRequests(q, minDurationMs, limit));
  }

  cypher(q: string, minDurationMs: number, limit: number): Observable<CypherRow[]> {
    return this.http.get<CypherRow[]>(this.restApiUrl.logsExplorerCypher(q, minDurationMs, limit));
  }
}
