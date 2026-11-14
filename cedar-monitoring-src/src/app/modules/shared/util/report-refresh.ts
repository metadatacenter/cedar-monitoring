import {defer, Observable, Subscription, take} from 'rxjs';

/** One cancellable refresh chain. Pausing freezes the last report, including in-flight responses. */
export class ReportRefresh<T> {
  enabled = true;
  loading = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private request: Subscription | null = null;
  private destroyed = false;

  constructor(private interval: number,
              private read: () => Observable<T>,
              private receive: (value: T) => void,
              private fail: (error: unknown) => void,
              private loadingChanged: (loading: boolean) => void = () => {}) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.reload();
    else this.stop();
  }

  /** An explicit Reload is allowed while paused; it does not resume automatic updates. */
  reload(): void {
    if (this.destroyed) return;
    this.stop();
    this.setLoading(true);
    this.request = defer(this.read).pipe(take(1)).subscribe({
      next: value => this.receive(value),
      error: error => { this.fail(error); this.finished(); },
      complete: () => this.finished()
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
  }

  private finished(): void {
    this.setLoading(false);
    if (this.enabled && !this.destroyed) this.timer = setTimeout(() => this.reload(), this.interval);
  }

  private stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.request?.unsubscribe();
    this.request = null;
    this.setLoading(false);
  }

  private setLoading(loading: boolean): void {
    if (this.loading === loading) return;
    this.loading = loading;
    this.loadingChanged(loading);
  }
}
