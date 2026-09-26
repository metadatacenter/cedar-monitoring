import {of} from 'rxjs';
import {LogUsageComponent} from './log-usage.component';
import {LogUsageService} from '../../../../services/load-data/log-usage.service';
import {PagedList} from '../../../../shared/model/paged-list.model';

describe('LogUsageComponent', () => {
  const paging: PagedList = {request: {limit: 100, offset: 0}, totalCount: 2, currentOffset: 0, paging: {}};

  function serviceStub() {
    return jasmine.createSpyObj<LogUsageService>('LogUsageService', {
      summary: of({from: 'F', to: 'T', totals: {reqCount: 0, errorCount: 0, p50Nanos: 0, p95Nanos: 0, p99Nanos: 0}, series: []}),
      endpoints: of({...paging, endpoints: [
        {component: 'R', className: 'A', methodName: 'get', httpMethod: 'GET', reqCount: 5, errorCount: 0,
          p50Nanos: 0, p95Nanos: 0, p99Nanos: 0, maxNanos: 0},
        {component: 'R', className: 'B', methodName: 'get', httpMethod: 'GET', reqCount: 4, errorCount: 0,
          p50Nanos: 0, p95Nanos: 0, p99Nanos: 0, maxNanos: 0}]}),
      cypher: of({...paging, statements: [
        {operation: 'op', runnableHash: 'h', sample: 's', execCount: 3, p50Nanos: 0, p95Nanos: 0, p99Nanos: 0,
          maxNanos: 0}]}),
      users: of({...paging, users: [{userId: 'u', authSource: 'k', apiKeyHash: '', reqCount: 1, errorCount: 0}]}),
      insights: of({slowestCypher: [], slowestEndpoints: [], heaviestUsers: [], errorHotspots: []})
    });
  }

  it('shows the rows of each breakdown page, as the arrays the template iterates', () => {
    const svc = serviceStub();
    const component = new LogUsageComponent(svc);

    component.setRange(7);

    expect(component.endpoints.map(e => e.className)).toEqual(['A', 'B']);
    expect(component.cypher.map(c => c.runnableHash)).toEqual(['h']);
    expect(component.users.map(u => u.userId)).toEqual(['u']);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('still asks for the busiest hundred of each breakdown', () => {
    const svc = serviceStub();
    const component = new LogUsageComponent(svc);

    component.setRange(1);

    expect(svc.endpoints).toHaveBeenCalledWith(component.from, component.to, 100);
    expect(svc.cypher).toHaveBeenCalledWith(component.from, component.to, 100);
    expect(svc.users).toHaveBeenCalledWith(component.from, component.to, 100);
  });
});
