import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {HostDiskReport, HostGitReport} from '../../shared/model/host-report.model';

/**
 * Reads the monitoring server's own host through /host/*.
 *
 * These are the two facts no per-service route can answer, because a checkout and a log directory
 * belong to a host rather than to a service. Both responses carry a `scope` saying which host that
 * is, and the pages show it.
 */
@Injectable({
  providedIn: 'root'
})
export class HostReportService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  git(): Observable<HostGitReport> {
    return this.http.get<HostGitReport>(this.restApiUrl.hostGit());
  }

  disk(): Observable<HostDiskReport> {
    return this.http.get<HostDiskReport>(this.restApiUrl.hostDisk());
  }
}
