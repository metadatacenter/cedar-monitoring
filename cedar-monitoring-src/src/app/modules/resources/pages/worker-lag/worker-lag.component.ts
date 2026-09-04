import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkerLagService} from '../../../../services/load-data/worker-lag.service';
import {WorkerLag, WorkerLagStatus} from '../../../../shared/model/worker-lag.model';

@Component({
  selector: 'app-worker-lag',
  templateUrl: './worker-lag.component.html',
  styleUrls: ['./worker-lag.component.scss']
})
export class WorkerLagComponent implements OnInit, OnDestroy {

  lag: WorkerLag | null = null;
  loading = false;
  error: string | null = null;

  autoRefresh = true;

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private svc: WorkerLagService) {
  }

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.scheduleReload();
    } else {
      this.stopTimer();
    }
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.svc.lag().subscribe({
      next: lag => {
        this.lag = lag;
        this.loading = false;
        this.scheduleReload();
      },
      error: e => {
        this.error = `Could not read the worker report${e?.status ? ` (HTTP ${e.status})` : ''}.`;
        this.loading = false;
        this.scheduleReload();
      }
    });
  }

  statusClass(status: WorkerLagStatus | undefined): string {
    switch (status) {
      case 'OK':
        return 'status-ok';
      case 'LAGGING':
        return 'status-warn';
      case 'STALLED':
        return 'status-bad';
      default:
        return 'status-unknown';
    }
  }

  /** What the verdict means, said once rather than left to the reader to infer from two numbers. */
  statusExplanation(lag: WorkerLag): string {
    switch (lag.status) {
      case 'OK':
        return 'The worker is draining the queue and writing rows.';
      case 'LAGGING':
        return 'Rows are still arriving but they are behind. A backlog, a slow log database, or a worker that '
          + 'has just restarted.';
      case 'STALLED':
        return 'Nothing has been written for over an hour. The worker is almost certainly down — every request '
          + 'is still being served normally, because the log queue is drained asynchronously and its loss is '
          + 'silent.';
      default:
        return 'No rows have ever been written to these tables, so there is nothing to measure lag against.';
    }
  }

  duration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) {
      return '—';
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ${seconds % 60}s`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 48) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  private scheduleReload(): void {
    this.stopTimer();
    if (this.autoRefresh) {
      this.timer = setTimeout(() => this.reload(), 10_000);
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
