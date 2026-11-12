import {Subject} from 'rxjs';
import {ReportRefresh} from './report-refresh';

describe('ReportRefresh', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const requests: Subject<number>[] = [];
    const read = vi.fn(() => { const request = new Subject<number>(); requests.push(request); return request; });
    const receive = vi.fn();
    const fail = vi.fn();
    const loading = vi.fn();
    const refresh = new ReportRefresh(2000, read, receive, fail, loading);
    return {refresh, requests, read, receive, fail, loading};
  }

  it('freezes a paused report even when an in-flight read answers, then resumes from fresh data', () => {
    const {refresh, requests, read, receive} = setup();
    refresh.reload(); requests[0].next(1);
    vi.advanceTimersByTime(2000);
    refresh.setEnabled(false); requests[1].next(2);
    vi.advanceTimersByTime(20_000);
    expect(receive.mock.calls).toEqual([[1]]);
    expect(read).toHaveBeenCalledTimes(2);
    refresh.setEnabled(true);
    expect(read).toHaveBeenCalledTimes(3);
    requests[2].next(3);
    expect(receive.mock.calls).toEqual([[1], [3]]);
    refresh.destroy();
  });

  it('allows one manual reload while paused without resuming polling', () => {
    const {refresh, requests, read, receive} = setup();
    refresh.setEnabled(false); refresh.reload(); requests[0].next(4);
    vi.advanceTimersByTime(20_000);
    expect(receive).toHaveBeenCalledWith(4);
    expect(read).toHaveBeenCalledTimes(1);
    expect(refresh.enabled).toBe(false);
    refresh.destroy();
  });

  it('replaces overlapping reloads and releases the loading indicator on pause and destruction', () => {
    const {refresh, requests, receive, loading, read} = setup();
    refresh.reload(); refresh.reload(); requests[0].next(1);
    expect(receive).not.toHaveBeenCalled();
    refresh.setEnabled(false); requests[1].next(2);
    expect(refresh.loading).toBe(false);
    expect(loading).toHaveBeenLastCalledWith(false);
    refresh.setEnabled(true); refresh.destroy(); requests[2].next(3);
    vi.advanceTimersByTime(20_000); refresh.reload();
    expect(receive).not.toHaveBeenCalled();
    expect(read).toHaveBeenCalledTimes(3);
    expect(loading).toHaveBeenLastCalledWith(false);
  });

  it('retries a failed read on the same single timer chain', () => {
    const {refresh, requests, read, fail, receive} = setup();
    refresh.reload(); requests[0].error(new Error('offline'));
    expect(fail).toHaveBeenCalledTimes(1);
    expect(refresh.loading).toBe(false);
    vi.advanceTimersByTime(2000); requests[1].next(5);
    vi.advanceTimersByTime(1999);
    expect(receive).toHaveBeenCalledWith(5);
    expect(read).toHaveBeenCalledTimes(2);
    refresh.destroy();
  });
});
