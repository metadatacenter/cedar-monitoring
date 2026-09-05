import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {forkJoin} from 'rxjs';
import {LogUsageService} from '../../../../services/load-data/log-usage.service';
import {
  CypherStat,
  EndpointStat,
  Insights,
  UsageSummary,
  UserStat
} from '../../../../shared/model/log-usage.model';

@Component({
  selector: 'app-log-usage',
  templateUrl: './log-usage.component.html',
  styleUrls: ['./log-usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class LogUsageComponent implements OnInit {

  from = '';
  to = '';
  rangeDays = 7;

  loading = false;
  error: string | null = null;

  summary?: UsageSummary;
  endpoints: EndpointStat[] = [];
  cypher: CypherStat[] = [];
  users: UserStat[] = [];
  insights?: Insights;

  endpointColumns = ['endpoint', 'reqCount', 'errPct', 'p50', 'p95', 'max'];
  cypherColumns = ['operation', 'execCount', 'p50', 'p95', 'max'];
  userColumns = ['userId', 'auth', 'reqCount', 'errPct'];

  constructor(private svc: LogUsageService) {
  }

  ngOnInit(): void {
    this.setRange(7);
  }

  setRange(days: number): void {
    this.rangeDays = days;
    const now = new Date();
    this.to = now.toISOString();
    this.from = new Date(now.getTime() - days * 86_400_000).toISOString();
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      summary: this.svc.summary(this.from, this.to),
      endpoints: this.svc.endpoints(this.from, this.to, 100),
      cypher: this.svc.cypher(this.from, this.to, 100),
      users: this.svc.users(this.from, this.to, 100),
      insights: this.svc.insights(this.from, this.to)
    }).subscribe({
      next: (r) => {
        this.summary = r.summary;
        this.endpoints = r.endpoints;
        this.cypher = r.cypher;
        this.users = r.users;
        this.insights = r.insights;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.status ? `Request failed (HTTP ${e.status}).` : 'Could not reach the aggregation API.';
        this.loading = false;
      }
    });
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

  fmtN(n: number): string {
    return (n ?? 0).toLocaleString('en-US');
  }

  errPct(errorCount: number, reqCount: number): number {
    return reqCount ? (errorCount / reqCount) * 100 : 0;
  }

  errClass(errorCount: number, reqCount: number): string {
    const p = this.errPct(errorCount, reqCount);
    return p > 2 ? 'err-bad' : p > 1 ? 'err-warn' : 'err-ok';
  }

  endpointLabel(e: EndpointStat): string {
    return `${e.httpMethod} ${e.className}.${e.methodName}`;
  }

  shortHash(h: string): string {
    return h ? h.substring(0, 8) : '';
  }

  authLabel(u: UserStat): string {
    if (u.authSource === 'apiKey') {
      return u.apiKeyHash ? 'apiKey ' + this.shortHash(u.apiKeyHash) : 'apiKey';
    }
    return u.authSource || 'unknown';
  }
}
