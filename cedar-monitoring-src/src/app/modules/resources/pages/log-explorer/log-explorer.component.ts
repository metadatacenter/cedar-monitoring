import {Component, OnInit} from '@angular/core';
import {LogQueryService} from '../../../../services/load-data/log-query.service';
import {
  Board,
  ColumnMeta,
  CoverageResult,
  FacetValue,
  LogQuerySpec,
  LogTable,
  QueryFilter,
  QueryResult
} from '../../../../shared/model/log-query.model';

interface FacetDef {
  col: string;
  label: string;
  values: FacetValue[];
  selected: string;
}

/**
 * Live Log Explorer, on the structured query engine (POST /logs/query).
 *
 * Three things this page does that the previous flat list could not, per
 * cedar-development/ops/LOG-EXPLORER-UI-PLAN.md §6-7:
 *  - pages past the first 100 rows, by keyset cursor on (timeColumn, id) rather than OFFSET;
 *  - filters on any allowlisted column, with facet dropdowns populated from the data itself;
 *  - copies the FULL value of any cell — the display truncates ids and hashes, so copying the
 *    rendered text would hand over a useless prefix.
 *
 * Columns come from the response's ColumnMeta rather than hardcoded markup, so one template renders
 * both tables (and, later, the grouped/pivot mode).
 */
@Component({
  selector: 'app-log-explorer',
  templateUrl: './log-explorer.component.html',
  styleUrls: ['./log-explorer.component.scss']
})
export class LogExplorerComponent implements OnInit {

  readonly ranges = [
    {label: '15m', minutes: 15},
    {label: '1h', minutes: 60},
    {label: '24h', minutes: 60 * 24},
    {label: '7d', minutes: 60 * 24 * 7},
    {label: '30d', minutes: 60 * 24 * 30}
  ];
  readonly pageSizes = [100, 500, 2000];

  table: LogTable = 'request';
  rangeMinutes = 60 * 24;
  pageSize = 100;
  contains = '';
  minDurationMs = 0;

  facets: FacetDef[] = [];
  filters: QueryFilter[] = [];

  columns: ColumnMeta[] = [];
  rows: Array<Record<string, any>> = [];
  notes: string[] = [];
  elapsedMs = 0;
  truncated = false;
  nextCursor: string | null = null;
  coverage: CoverageResult | null = null;

  loading = false;
  error: string | null = null;
  expanded = new Set<number>();
  copied: string | null = null;

  /** Board mode: the same table renders the grouped result; null means raw-row mode. */
  boards: Board[] = [];
  boardGroups: string[] = [];
  activeBoard: Board | null = null;

  pageIndex = 0;
  private cursor: string | null = null;
  private cursorStack: Array<string | null> = [];
  private copiedTimer: any = null;

  /** Held back from the row so it stays readable; still shown in full when the row is expanded. */
  private static readonly DETAIL_ONLY = ['errorPack', 'parameters', 'queryParameters'];

  private static readonly FACET_COLUMNS: Record<LogTable, Array<{ col: string; label: string }>> = {
    request: [
      {col: 'component', label: 'Component'},
      {col: 'httpMethod', label: 'Method'},
      {col: 'statusClass', label: 'Status'},
      {col: 'authSource', label: 'Auth'}
    ],
    cypher: [
      {col: 'component', label: 'Component'},
      {col: 'operation', label: 'Operation'}
    ]
  };

  constructor(private svc: LogQueryService) {
  }

  ngOnInit(): void {
    this.svc.coverage().subscribe({next: (c) => this.coverage = c, error: () => this.coverage = null});
    this.svc.boards().subscribe({
      next: (b) => {
        this.boards = b || [];
        this.boardGroups = this.boards.map(x => x.group).filter((g, i, a) => a.indexOf(g) === i);
      },
      error: () => this.boards = []
    });
    this.resetAndLoad();
  }

  // ---- boards ------------------------------------------------------------------------------------

  boardsIn(group: string): Board[] {
    return this.boards.filter(b => b.group === group);
  }

  /**
   * Open a pre-defined question. The board's spec replaces the ad-hoc filters, the table follows the
   * board, and the range jumps to the board's suggested window — but the range and page size stay
   * editable, so a board is a starting point rather than a dead end.
   */
  openBoard(b: Board): void {
    this.activeBoard = b;
    this.table = (b.spec.table || 'request') as LogTable;
    this.rangeMinutes = b.defaultRangeMinutes || this.rangeMinutes;
    this.filters = [];
    this.contains = '';
    this.minDurationMs = 0;
    this.facets = [];
    this.resetAndLoad();
  }

  closeBoard(): void {
    this.activeBoard = null;
    this.resetAndLoad();
  }

  // ---- controls ----------------------------------------------------------------------------------

  setTable(t: LogTable): void {
    if (this.table !== t) {
      this.table = t;
      this.contains = '';
      this.filters = [];       // column names differ between the tables
      this.facets = [];
      this.activeBoard = null; // a board is bound to its own table
      this.resetAndLoad();
    }
  }

  setRange(minutes: number): void {
    this.rangeMinutes = minutes;
    this.facets = [];              // facet counts are range-scoped
    this.resetAndLoad();
  }

  setPageSize(size: any): void {
    this.pageSize = Number(size);
    this.resetAndLoad();
  }

  removeFilter(i: number): void {
    this.filters.splice(i, 1);
    this.resetAndLoad();
  }

  clearAll(): void {
    this.filters = [];
    this.contains = '';
    this.minDurationMs = 0;
    this.facets.forEach(f => f.selected = '');
    this.resetAndLoad();
  }

  /** Clicking a value in a row filters by it — the fastest way to narrow a search. */
  filterBy(col: string, value: any): void {
    if (value == null || value === '') {
      return;
    }
    this.filters.push({col, op: 'eq', val: String(value)});
    this.resetAndLoad();
  }

  hasActiveFilters(): boolean {
    return this.filters.length > 0 || !!this.contains.trim() || this.minDurationMs > 0
      || this.facets.some(f => !!f.selected);
  }

  // ---- paging ------------------------------------------------------------------------------------

  nextPage(): void {
    if (!this.nextCursor) {
      return;
    }
    this.cursorStack.push(this.cursor);
    this.cursor = this.nextCursor;
    this.pageIndex++;
    this.load();
  }

  prevPage(): void {
    if (!this.cursorStack.length) {
      return;
    }
    this.cursor = this.cursorStack.pop() ?? null;
    this.pageIndex--;
    this.load();
  }

  resetAndLoad(): void {
    this.cursor = null;
    this.cursorStack = [];
    this.pageIndex = 0;
    this.load();
  }

  // ---- loading -----------------------------------------------------------------------------------

  private buildSpec(): LogQuerySpec {
    const to = new Date();
    const from = new Date(to.getTime() - this.rangeMinutes * 60_000);

    // A board is just a saved spec — take it verbatim and supply the range the page is showing.
    if (this.activeBoard) {
      return {
        ...this.activeBoard.spec,
        table: this.table,
        from: from.toISOString(),
        to: to.toISOString(),
        cursor: null
      };
    }

    const filters: QueryFilter[] = [...this.filters];
    for (const f of this.facets) {
      if (f.selected) {
        filters.push({col: f.col, op: 'eq', val: f.selected});
      }
    }
    if (this.contains.trim()) {
      filters.push({col: this.textColumn(), op: 'like', val: this.contains.trim()});
    }
    if (this.minDurationMs > 0) {
      filters.push({col: this.durationColumn(), op: 'gte', val: String(this.minDurationMs * 1_000_000)});
    }
    return {
      table: this.table,
      from: from.toISOString(),
      to: to.toISOString(),
      filters,
      limit: this.pageSize,
      cursor: this.cursor
    };
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.expanded.clear();

    this.svc.query(this.buildSpec()).subscribe({
      next: (r: QueryResult) => {
        this.columns = (r.columns || []).filter(c => c.key !== '_id');
        this.rows = r.rows || [];
        this.notes = r.notes || [];
        this.elapsedMs = r.elapsedMs;
        this.truncated = r.truncated;
        this.nextCursor = r.nextCursor;
        this.loading = false;
        this.loadFacets();
      },
      error: (e) => {
        // the engine returns {"error": "..."} naming the offending field — show that, not "HTTP 400"
        this.error = e?.error?.error ? e.error.error
          : (e?.status ? `Request failed (HTTP ${e.status}).` : 'Could not reach the log API.');
        this.loading = false;
      }
    });
  }

  /** Facet values are fetched once per (table, range) and reused across filter changes. */
  private loadFacets(): void {
    if (this.facets.length || this.activeBoard) {
      return;                  // board mode has no ad-hoc filter row, so don't spend 4 requests on it
    }
    const to = new Date();
    const from = new Date(to.getTime() - this.rangeMinutes * 60_000);
    const defs = LogExplorerComponent.FACET_COLUMNS[this.table];
    this.facets = defs.map(d => ({col: d.col, label: d.label, values: [], selected: ''}));
    defs.forEach((d, i) => {
      this.svc.facet(this.table, d.col, from.toISOString(), to.toISOString()).subscribe({
        next: (f) => this.facets[i].values = (f.values || []).filter(v => v.value != null),
        error: () => this.facets[i].values = []
      });
    });
  }

  // ---- copy (delegated: ONE listener for the whole table) ----------------------------------------

  /**
   * Single delegated handler on <tbody>, resolving both "copy this cell" and "expand this row".
   * Per-cell copy buttons would mean 6 columns x up to 2,000 rows = 12,000 bindings and listeners;
   * a data attribute costs nothing. The text copied comes from data-copy, which carries the
   * untruncated value rather than the ellipsised display text.
   */
  onTableClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement | null;
    if (!target || !target.closest) {
      return;
    }
    const copyEl = target.closest('[data-copy]') as HTMLElement | null;
    if (copyEl) {
      this.copyText(copyEl.getAttribute('data-copy') || '', copyEl.getAttribute('data-copy-key') || '');
      return;
    }
    const rowEl = target.closest('tr[data-row]') as HTMLElement | null;
    if (rowEl) {
      this.toggle(Number(rowEl.getAttribute('data-row')));
    }
  }

  copyText(text: string, key: string): void {
    if (!text) {
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => this.flashCopied(key || 'value'), () => this.flashCopied('copy failed'));
  }

  copyRowJson(row: Record<string, any>, i: number): void {
    this.copyText(JSON.stringify(row, null, 2), 'row ' + (i + 1) + ' as JSON');
  }

  /** The whole page of results as TSV — paste straight into a spreadsheet. */
  copyTsv(): void {
    const head = this.columns.map(c => c.key).join('\t');
    const body = this.rows.map(r => this.columns.map(c => this.flat(r[c.key])).join('\t')).join('\n');
    this.copyText(head + '\n' + body, `${this.rows.length} rows as TSV`);
  }

  downloadCsv(): void {
    const esc = (v: any) => {
      const s = this.flat(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const head = this.columns.map(c => c.key).join(',');
    const body = this.rows.map(r => this.columns.map(c => esc(r[c.key])).join(',')).join('\n');
    const blob = new Blob([head + '\n' + body], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cedar-log-${this.table}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private flashCopied(what: string): void {
    this.copied = what;
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = setTimeout(() => this.copied = null, 1500);
  }

  private flat(v: any): string {
    return v == null ? '' : String(v).replace(/[\t\r\n]+/g, ' ');
  }

  // ---- rendering helpers -------------------------------------------------------------------------

  get mainColumns(): ColumnMeta[] {
    return this.columns.filter(c => !LogExplorerComponent.DETAIL_ONLY.includes(c.key));
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

  /** Untruncated value, for data-copy and the expanded detail. */
  raw(row: Record<string, any>, col: ColumnMeta): string {
    const v = row[col.key];
    return v == null ? '' : String(v);
  }

  display(row: Record<string, any>, col: ColumnMeta): string {
    const v = row[col.key];
    if (v == null || v === '') {
      return '—';
    }
    if (col.type === 'NANOS') {
      return this.fmtMs(Number(v));
    }
    if (col.type === 'TIMESTAMP') {
      return this.ago(String(v));
    }
    if (col.key === 'userId') {
      return this.shortUser(String(v));
    }
    if (col.key === 'handler') {
      return this.shortHandler(String(v));
    }
    if (col.key === 'runnableHash' || col.key === 'apiKeyHash' || col.key === 'globalRequestId') {
      return this.shortHash(String(v));
    }
    return String(v);
  }

  /**
   * Every CEDAR handler starts with the same package, which just eats width — drop it. The untruncated
   * value stays in the title and in data-copy, so the copy still yields the fully-qualified name.
   */
  shortHandler(h: string): string {
    return h.replace(/^org\.metadatacenter\.cedar\./, '').replace(/^org\.metadatacenter\./, '');
  }

  cellClass(col: ColumnMeta): string {
    const mono = col.type === 'NANOS' || col.type === 'TEXT'
      || ['userId', 'runnableHash', 'apiKeyHash', 'globalRequestId', 'operation'].includes(col.key);
    // ellipsise the two columns that would otherwise push everything else off-screen
    const wide = col.type === 'TEXT' || col.key === 'handler' || col.key === 'path';
    return (mono ? 'mono ' : '') + (col.type === 'NANOS' ? 'num ' : '') + (wide ? 'ell' : '');
  }

  isFacetColumn(key: string): boolean {
    return LogExplorerComponent.FACET_COLUMNS[this.table].some(f => f.col === key);
  }

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

  statusClass(status: any): string {
    if (status == null) {
      return 's-unknown';
    }
    return 's' + Math.floor(Number(status) / 100);
  }

  shortUser(userId: string): string {
    if (!userId) {
      return 'anonymous';
    }
    const tail = userId.split('/').pop() || userId;
    return tail.length > 12 ? tail.substring(0, 12) + '…' : tail;
  }

  shortHash(h: string): string {
    return h && h.length > 10 ? h.substring(0, 10) + '…' : h;
  }

  pretty(json: any): string {
    if (json == null) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(String(json)), null, 2);
    } catch {
      return String(json);
    }
  }

  private textColumn(): string {
    return this.table === 'request' ? 'path' : 'runnable';
  }

  private durationColumn(): string {
    return this.table === 'request' ? 'handlerDuration' : 'duration';
  }
}
