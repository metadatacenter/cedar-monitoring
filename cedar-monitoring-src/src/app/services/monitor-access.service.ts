import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {RestApiUrlService} from './rest-api-url.service';

export type MonitorAccess = 'allowed' | 'denied';

/**
 * Only a refusal means "no access". Any other failure — the monitor server down, or reporting itself
 * unhealthy — lets the user in, so the pages can show that failure for what it is.
 */
export function accessFromStatus(status: number): MonitorAccess {
  return status === 401 || status === 403 ? 'denied' : 'allowed';
}

/**
 * Whether the signed-in user may read the Monitor at all.
 *
 * Every monitor-server route requires MONITOR_READ, which the monitorManager role grants. Signing in
 * does not imply it, and without it every page fills with 403s that read as outages. The token does
 * not carry CEDAR permissions (they live on the user profile), so this asks the server, once per page
 * load, on the cheapest gated route: the monitor server's own health check, which refuses before it
 * proxies anything.
 */
@Injectable({
  providedIn: 'root'
})
export class MonitorAccessService {

  private access: Promise<MonitorAccess> | null = null;

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  check(): Promise<MonitorAccess> {
    if (this.access === null) {
      this.access = firstValueFrom(this.http.get(this.restApiUrl.healthCheck('monitor')))
        .then(() => 'allowed' as MonitorAccess)
        .catch((error: HttpErrorResponse) => accessFromStatus(error.status));
    }
    return this.access;
  }

  /** Forget the answer, for after an administrator has granted the role. */
  reset() {
    this.access = null;
  }
}
