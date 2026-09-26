import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {LogUsageService} from './log-usage.service';
import {LogExplorerService} from './log-explorer.service';
import {RestApiUrlService} from '../rest-api-url.service';
import {globalAppConfig} from '../../../environments/global-app-config';
import {EndpointStatPage} from '../../shared/model/log-usage.model';
import {RequestRowPage} from '../../shared/model/log-explorer.model';

describe('log listing services', () => {
  let http: HttpTestingController;
  let usage: LogUsageService;
  let explorer: LogExplorerService;
  let urls: RestApiUrlService;
  const api = 'https://monitor.test/';

  beforeEach(() => {
    globalAppConfig.apiUrl = api;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    usage = TestBed.inject(LogUsageService);
    explorer = TestBed.inject(LogExplorerService);
    urls = TestBed.inject(RestApiUrlService);
  });

  afterEach(() => http.verify());

  describe('URLs', () => {
    it('leave the offset out of a first page', () => {
      expect(urls.logsUsageEndpoints('F', 'T', 100)).toBe(`${api}logs/usage/endpoints?from=F&to=T&limit=100`);
      expect(urls.logsExplorerRequests('', 0, 50)).toBe(`${api}logs/explorer/requests?limit=50`);
    });

    it('add the offset of a later page beside the filters', () => {
      expect(urls.logsUsageUsers('F', 'T', 100, 200)).toBe(`${api}logs/usage/users?from=F&to=T&limit=100&offset=200`);
      expect(urls.logsExplorerCypher('MATCH x', 5, 50, 100))
        .toBe(`${api}logs/explorer/cypher?limit=50&offset=100&q=MATCH%20x&minDurationMs=5`);
    });
  });

  it('reads a usage breakdown as a page', () => {
    const body: EndpointStatPage = {
      request: {limit: 2, offset: 0}, totalCount: 3, currentOffset: 0,
      paging: {first: 'f', next: 'n', last: 'l'},
      endpoints: [endpoint('A', 9), endpoint('B', 8)]
    };
    let received: EndpointStatPage | undefined;

    usage.endpoints('F', 'T', 2).subscribe(page => received = page);
    http.expectOne(`${api}logs/usage/endpoints?from=F&to=T&limit=2`).flush(body);

    expect(received?.totalCount).toBe(3);
    expect(received?.endpoints.map(e => e.className)).toEqual(['A', 'B']);
    expect(received?.paging.next).toBe('n');
  });

  it('asks for a later usage page by offset', () => {
    usage.cypher('F', 'T', 100, 100).subscribe();
    http.expectOne(`${api}logs/usage/cypher?from=F&to=T&limit=100&offset=100`)
      .flush({request: {limit: 100, offset: 100}, totalCount: 150, currentOffset: 100, paging: {}, statements: []});
  });

  it('reads a capped raw-log page', () => {
    let received: RequestRowPage | undefined;

    explorer.requests('folders', 0, 100).subscribe(page => received = page);
    http.expectOne(`${api}logs/explorer/requests?limit=100&q=folders`).flush({
      request: {limit: 100, offset: 0}, totalCount: 10500, currentOffset: 0, countCapped: true,
      paging: {first: 'f', next: 'n'}, requests: []
    });

    expect(received?.countCapped).toBeTrue();
    expect(received?.paging.last).toBeUndefined();
  });

  function endpoint(className: string, reqCount: number) {
    return {
      component: 'RESOURCE', className, methodName: 'get', httpMethod: 'GET', reqCount, errorCount: 0,
      p50Nanos: 0, p95Nanos: 0, p99Nanos: 0, maxNanos: 0
    };
  }
});
