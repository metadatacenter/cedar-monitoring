import {describe, expect, it} from 'vitest';
import {searchIndexStatusFrom} from './search-index.service';

describe('searchIndexStatusFrom', () => {
  it('reports the newest search index job', () => {
    const status = searchIndexStatusFrom({jobs: [
      {jobId: 'new', state: 'RUNNING'} as any,
      {jobId: 'old', state: 'COMPLETE'} as any,
    ]});
    expect(status.SEARCH.jobId).toBe('new');
    expect(status.SEARCH.state).toBe('RUNNING');
  });
  for (const page of [{jobs: []}, {}, null])
    it(`shows an index no job has run over as idle: ${JSON.stringify(page)}`, () => {
      const status = searchIndexStatusFrom(page);
      expect(status.SEARCH.state).toBe('IDLE');
      expect(status.SEARCH.jobId).toBeNull();
    });
});
