import {Component, OnInit} from '@angular/core';
import {LogExplorerService} from '../../../../services/load-data/log-explorer.service';
import {CypherRow, RequestRow} from '../../../../shared/model/log-explorer.model';

@Component({
  selector: 'app-log-explorer',
  templateUrl: './log-explorer.component.html',
  styleUrls: ['./log-explorer.component.scss']
})
export class LogExplorerComponent implements OnInit {

  tab: 'requests' | 'cypher' = 'requests';
  q = '';
  minDurationMs = 0;
  limit = 100;

  loading = false;
  error: string | null = null;

  requests: RequestRow[] = [];
  cypher: CypherRow[] = [];
  expanded = new Set<number>();

  constructor(private svc: LogExplorerService) {
  }

  ngOnInit(): void {
    this.reload();
  }

  setTab(t: 'requests' | 'cypher'): void {
    if (this.tab !== t) {
      this.tab = t;
      this.reload();
    }
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.expanded.clear();
    const done = (ok: () => void) => {
      ok();
      this.loading = false;
    };
    const fail = (e: any) => {
      this.error = e?.status ? `Request failed (HTTP ${e.status}).` : 'Could not reach the log API.';
      this.loading = false;
    };
    if (this.tab === 'requests') {
      this.svc.requests(this.q, this.minDurationMs, this.limit)
        .subscribe({next: (r) => done(() => this.requests = r), error: fail});
    } else {
      this.svc.cypher(this.q, this.minDurationMs, this.limit)
        .subscribe({next: (r) => done(() => this.cypher = r), error: fail});
    }
  }

  toggle(i: number): void {
    if (this.expanded.has(i)) {
      this.expanded.delete(i);
    } else {
      this.expanded.add(i);
    }
  }

  isOpen(i: number): boolean {
    return this.expanded.has(i);
  }

  // ---- display helpers ---------------------------------------------------------------------------

  fmtMs(nanos: number): string {
    if (!nanos) {
      return '0';
    }
    const ms = nanos / 1_000_000;
    if (ms < 1) {
      return (ms * 1000).toFixed(0) + 'µs';
    }
    if (ms < 1000) {
      return ms.toFixed(ms < 10 ? 1 : 0) + 'ms';
    }
    return (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + 's';
  }

  ago(iso: string): string {
    const d = (Date.now() - Date.parse(iso)) / 1000;
    if (isNaN(d)) {
      return iso;
    }
    if (d < 60) {
      return Math.floor(d) + 's ago';
    }
    if (d < 3600) {
      return Math.floor(d / 60) + 'm ago';
    }
    if (d < 86400) {
      return Math.floor(d / 3600) + 'h ago';
    }
    return Math.floor(d / 86400) + 'd ago';
  }

  statusClass(status: number | null): string {
    if (status == null) {
      return 's-unknown';
    }
    return 's' + Math.floor(status / 100);
  }

  shortUser(userId: string): string {
    if (!userId) {
      return 'anonymous';
    }
    const tail = userId.split('/').pop() || userId;
    return tail.length > 12 ? tail.substring(0, 12) + '…' : tail;
  }

  shortHash(h: string): string {
    return h ? h.substring(0, 8) : '';
  }

  pretty(json: string | null): string {
    if (!json) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }
}
