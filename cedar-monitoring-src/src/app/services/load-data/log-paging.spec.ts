import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {LogUsageService} from './log-usage.service';
import {RestApiUrlService} from '../rest-api-url.service';
import {globalAppConfig} from '../../../environments/global-app-config';
import {EndpointStatPage} from '../../shared/model/log-usage.model';

describe('log listing services', () => {
  let http: HttpTestingController;
  let usage: LogUsageService;
  let urls: RestApiUrlService;
  const api = 'https://monitor.test/';

  beforeEach(() => {
    globalAppConfig.apiUrl = api;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    usage = TestBed.inject(LogUsageService);
    urls = TestBed.inject(RestApiUrlService);
  });

  afterEach(() => http.verify());

  describe('URLs', () => {
    it('leave the offset out of a first page', () => {
      expect(urls.logsUsageEndpoints('F', 'T', 100)).toBe(`${api}logs/usage/endpoints?from=F&to=T&limit=100`);
    });

    it('add the offset of a later page beside the filters', () => {
      expect(urls.logsUsageUsers('F', 'T', 100, 200)).toBe(`${api}logs/usage/users?from=F&to=T&limit=100&offset=200`);
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

  function endpoint(className: string, reqCount: number) {
    return {
      component: 'RESOURCE', className, methodName: 'get', httpMethod: 'GET', reqCount, errorCount: 0,
      p50Nanos: 0, p95Nanos: 0, p99Nanos: 0, maxNanos: 0
    };
  }
});
