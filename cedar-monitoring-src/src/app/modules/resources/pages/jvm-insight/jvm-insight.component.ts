import {Component, OnDestroy, OnInit} from '@angular/core';
import {ServerReportService} from '../../../../services/load-data/server-report.service';
import {JvmInsight, ServerResult} from '../../../../shared/model/server-report.model';

/** One service's JVM, reduced to the numbers that fit on a row. */
interface JvmRow {
  server: string;
  error: string | null;
  heapUsed: number | null;
  heapMax: number | null;
  heapPercent: number | null;
  nonHeapUsed: number | null;
  threads: number | null;
  daemonThreads: number | null;
  gcCollections: number | null;
  processors: number | null;
  loadAverage: number | null;
  osName: string | null;
}

/** Heap above this share of its maximum is worth looking at before it becomes an outage. */
const HEAP_WARNING_PERCENT = 85;

@Component({
  selector: 'app-jvm-insight',
  templateUrl: './jvm-insight.component.html',
  styleUrls: ['./jvm-insight.component.scss']
})
export class JvmInsightComponent implements OnInit, OnDestroy {

  rows: JvmRow[] = [];
  loading = false;
  error: string | null = null;

  autoRefresh = true;
  readonly heapWarningPercent = HEAP_WARNING_PERCENT;

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private svc: ServerReportService) {
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
    this.svc.allInsights().subscribe({
      next: results => {
        this.rows = results.map(toRow);
        this.loading = false;
        this.scheduleReload();
      },
      error: () => {
        this.error = 'Could not reach the monitor API.';
        this.loading = false;
        this.scheduleReload();
      }
    });
  }

  get hotHeaps(): JvmRow[] {
    return this.rows.filter(row => row.heapPercent !== null && row.heapPercent >= HEAP_WARNING_PERCENT);
  }

  get unreachableCount(): number {
    return this.rows.filter(row => row.error !== null).length;
  }

  get totalThreads(): number {
    return this.rows.reduce((sum, row) => sum + (row.threads ?? 0), 0);
  }

  /** Fifteen JVMs on one box share its load average, so reporting it once is honest and reporting it per row is not. */
  get loadAverage(): number | null {
    const values = this.rows.map(row => row.loadAverage).filter((v): v is number => v !== null && v >= 0);
    return values.length ? Math.max(...values) : null;
  }

  bytes(value: number | null): string {
    if (value === null || value === undefined || value < 0) {
      return '—';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)}${units[unit]}`;
  }

  heapClass(row: JvmRow): string {
    if (row.heapPercent === null) {
      return '';
    }
    return row.heapPercent >= HEAP_WARNING_PERCENT ? 'bar-bad' : (row.heapPercent >= 70 ? 'bar-warn' : 'bar-ok');
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

/**
 * Flattens one service's /insight/full into a row.
 *
 * The response is a flat map with dotted keys, and the garbage collector entries are named after
 * whichever collectors the JVM happens to be running — so they are summed rather than looked up by
 * name, which would tie the page to a collector choice it has no business knowing about.
 */
function toRow(result: ServerResult<JvmInsight>): JvmRow {
  const data = result.data;
  if (!data) {
    return {
      server: result.server, error: result.error, heapUsed: null, heapMax: null, heapPercent: null,
      nonHeapUsed: null, threads: null, daemonThreads: null, gcCollections: null, processors: null,
      loadAverage: null, osName: null
    };
  }

  const heapUsed = num(data['jvm.memory.heap.used']);
  const heapMax = num(data['jvm.memory.heap.max']);
  const heapPercent = heapUsed !== null && heapMax !== null && heapMax > 0
    ? Math.round(heapUsed * 1000 / heapMax) / 10
    : null;

  const known = new Set([
    'jvm.memory.heap.used', 'jvm.memory.heap.max', 'jvm.memory.heap.committed', 'jvm.memory.heap.init',
    'jvm.memory.non-heap.used', 'jvm.memory.non-heap.max', 'jvm.memory.non-heap.committed',
    'jvm.memory.non-heap.init', 'jvm.runtime.memory.total', 'jvm.runtime.memory.free',
    'jvm.runtime.memory.max', 'os.available-processors', 'os.architecture', 'os.name', 'os.version',
    'os.load-average', 'current-thread.cpu-time', 'current-thread.user-time', 'thread.count',
    'thread.daemon.count', 'thread.started.count'
  ]);
  let gcCollections: number | null = null;
  for (const key of Object.keys(data)) {
    if (!known.has(key)) {
      const value = num(data[key]);
      if (value !== null) {
        gcCollections = (gcCollections ?? 0) + value;
      }
    }
  }

  return {
    server: result.server,
    error: null,
    heapUsed,
    heapMax,
    heapPercent,
    nonHeapUsed: num(data['jvm.memory.non-heap.used']),
    threads: num(data['thread.count']),
    daemonThreads: num(data['thread.daemon.count']),
    gcCollections,
    processors: num(data['os.available-processors']),
    loadAverage: num(data['os.load-average']),
    osName: typeof data['os.name'] === 'string' ? data['os.name'] as string : null
  };
}

function num(value: number | string | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}
