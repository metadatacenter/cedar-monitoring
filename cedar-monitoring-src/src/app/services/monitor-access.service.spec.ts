import {describe, expect, it} from 'vitest';
import {accessFromStatus} from './monitor-access.service';

describe('accessFromStatus', () => {
  for (const status of [401, 403])
    it(`denies on ${status}`, () => expect(accessFromStatus(status)).toBe('denied'));
  // A server that is down or unhealthy is a finding the pages should show, not a reason to keep the user out.
  for (const status of [0, 404, 500, 502, 503])
    it(`lets the user in on ${status}`, () => expect(accessFromStatus(status)).toBe('allowed'));
});
