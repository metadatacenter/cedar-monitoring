import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {RestApiUrlService} from '../rest-api-url.service';
import {MicroservicesService} from '../microservices.service';
import {
  BuildReport,
  ConfigurationReport,
  DeclarationsReport,
  EnvironmentReport,
  JvmInsight,
  ServerResult,
  UnmodelledReport
} from '../../shared/model/server-report.model';

/**
 * Reads each service's own report through cedar-monitor-server /server-report/{server}/*.
 * The keycloak-angular bearer interceptor attaches the token; every route is MONITOR_READ-gated.
 *
 * The fan-out lives here rather than on the server. Fifteen small parallel requests complete in the
 * time of the slowest server, and one server being unreachable leaves fourteen populated rows
 * instead of failing the page — which is exactly the situation these pages exist to diagnose, so
 * failing whole on it would be the wrong behaviour.
 */
@Injectable({
  providedIn: 'root'
})
export class ServerReportService {

  constructor(
    private http: HttpClient,
    private restApiUrl: RestApiUrlService,
    private microservices: MicroservicesService) {
  }

  environment(server: string): Observable<EnvironmentReport> {
    return this.http.get<EnvironmentReport>(this.restApiUrl.serverEnvironment(server));
  }

  configuration(server: string): Observable<ConfigurationReport> {
    return this.http.get<ConfigurationReport>(this.restApiUrl.serverConfiguration(server));
  }

  build(server: string): Observable<BuildReport> {
    return this.http.get<BuildReport>(this.restApiUrl.serverBuild(server));
  }

  insight(server: string): Observable<JvmInsight> {
    return this.http.get<JvmInsight>(this.restApiUrl.serverInsight(server));
  }

  /** The static declaration table for everything that is not a running server. */
  declarations(): Observable<DeclarationsReport> {
    return this.http.get<DeclarationsReport>(this.restApiUrl.environmentDeclarations());
  }

  /** CEDAR_* variables the host sets that the configuration model does not define. */
  unmodelled(): Observable<UnmodelledReport> {
    return this.http.get<UnmodelledReport>(this.restApiUrl.environmentUnmodelled());
  }

  allEnvironments(): Observable<ServerResult<EnvironmentReport>[]> {
    return this.fanOut(server => this.environment(server));
  }

  allBuilds(): Observable<ServerResult<BuildReport>[]> {
    return this.fanOut(server => this.build(server));
  }

  allInsights(): Observable<ServerResult<JvmInsight>[]> {
    return this.fanOut(server => this.insight(server));
  }

  /** The server names the matrix pages iterate, in the order they are displayed. */
  servers(): string[] {
    return this.microservices.getServerNames();
  }

  /**
   * Asks every server the same question and returns one result each, in server order.
   *
   * A failure is captured into its own result rather than propagated: `forkJoin` completes only if
   * every source completes, so an unhandled error from one server would discard the answers of all
   * the others.
   */
  private fanOut<T>(request: (server: string) => Observable<T>): Observable<ServerResult<T>[]> {
    const servers = this.servers();
    return forkJoin(
      servers.map(server => request(server).pipe(
        map(data => ({server, data, error: null, status: null} as ServerResult<T>)),
        catchError((e: HttpErrorResponse) => of({
          server,
          data: null,
          error: describe(e),
          status: e?.status ?? null
        } as ServerResult<T>))
      ))
    );
  }
}

/** A short reason a server did not answer, for a matrix cell that has room for a few words. */
function describe(e: HttpErrorResponse): string {
  if (!e || !e.status) {
    return 'unreachable';
  }
  if (e.status === 404) {
    return 'no such route (older build?)';
  }
  if (e.status === 403) {
    return 'forbidden';
  }
  if (e.status === 401) {
    return 'unauthorized';
  }
  return `HTTP ${e.status}`;
}
