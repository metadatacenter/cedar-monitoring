import {Component, OnInit} from '@angular/core';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ServerReportService} from '../../../../services/load-data/server-report.service';
import {
  ComponentDeclarations,
  DeclarationsReport,
  EnvironmentReport,
  EnvironmentVariableEntry,
  ServerResult,
  UnmodelledReport,
  VariableState
} from '../../../../shared/model/server-report.model';

/** One variable's row across every server. */
interface MatrixRow {
  name: string;
  secure: boolean;
  type: string;
  /** Per server, in column order. Null where that server did not answer at all. */
  cells: (EnvironmentVariableEntry | null)[];
  /** More than one distinct value among the servers that declare it. */
  drifts: boolean;
  /** Declared by at least one server and supplied by none of them — a boot-breaking hole. */
  missing: boolean;
  /** Set on the host but declared by no server, so nothing reads it. */
  unused: boolean;
}

@Component({
  selector: 'app-environment-matrix',
  templateUrl: './environment-matrix.component.html',
  styleUrls: ['./environment-matrix.component.scss']
})
export class EnvironmentMatrixComponent implements OnInit {

  servers: string[] = [];
  rows: MatrixRow[] = [];
  results: ServerResult<EnvironmentReport>[] = [];

  loading = false;
  error: string | null = null;

  filter = '';
  onlyFindings = false;
  hideUndeclared = false;

  /**
   * The components that are not running servers, and so appear as declarations without values: the
   * gulp-built frontends, the admin and caDSR tools, the Keycloak event listener, the shell utilities.
   */
  declarations: ComponentDeclarations[] = [];
  declarationNote = '';

  /** CEDAR_* set on the host that the configuration model does not define. */
  unmodelled: UnmodelledReport | null = null;

  /**
   * Which long values the reader has opened, keyed by variable and value.
   *
   * Kept here rather than on the row because the rows are recomputed on every change detection pass,
   * which would discard the flag as fast as it was set.
   */
  private opened = new Set<string>();

  constructor(private svc: ServerReportService) {
  }

  ngOnInit(): void {
    this.servers = this.svc.servers();
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    // The two model routes are the monitor's own and either can be missing on an older build, so
    // neither is allowed to take the matrix down with it.
    forkJoin({
      environments: this.svc.allEnvironments(),
      declarations: this.svc.declarations().pipe(catchError(() => of(null as DeclarationsReport | null))),
      unmodelled: this.svc.unmodelled().pipe(catchError(() => of(null as UnmodelledReport | null)))
    }).subscribe({
      next: r => {
        this.results = r.environments;
        this.declarations = r.declarations?.components ?? [];
        this.declarationNote = r.declarations?.note ?? '';
        // Rows are built after the declarations, because whether a variable is read by anything is a
        // question about every component and not only the fifteen that answer over HTTP.
        this.rows = buildRows(r.environments, declaredNames(this.declarations));
        this.unmodelled = r.unmodelled;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not reach the monitor API.';
        this.loading = false;
      }
    });
  }

  get unreachable(): ServerResult<EnvironmentReport>[] {
    return this.results.filter(r => r.data === null);
  }

  get visibleRows(): MatrixRow[] {
    const needle = this.filter.trim().toUpperCase();
    return this.rows.filter(row => {
      if (needle && !row.name.includes(needle)) {
        return false;
      }
      if (this.onlyFindings && !row.drifts && !row.missing && !row.unused) {
        return false;
      }
      if (this.hideUndeclared && row.cells.every(cell => !cell || cell.state === 'NOT_DECLARED')) {
        return false;
      }
      return true;
    });
  }

  get driftCount(): number {
    return this.rows.filter(row => row.drifts).length;
  }

  get missingCount(): number {
    return this.rows.filter(row => row.missing).length;
  }

  /**
   * Set on the host and read by nothing.
   *
   * Usually a name that does not match what any service declares — a typo, or a variable renamed on
   * one side of a release and not the other. It looks configured from the shell and has no effect,
   * which is a hard thing to notice any other way.
   */
  get unusedCount(): number {
    return this.rows.filter(row => row.unused).length;
  }

  /** The non-server components that declare a variable, for the row's tooltip. */
  readersOf(name: string): string[] {
    return this.declarations.filter(d => d.variables.some(v => v.name === name)).map(d => d.component);
  }

  get unmodelledNames(): string[] {
    return this.unmodelled ? Object.keys(this.unmodelled.variables) : [];
  }

  /**
   * One row per distinct value a variable resolved to, with the services that reported it.
   *
   * Grouped rather than listed per service because the fifteen services almost always agree, so a
   * per-service list is fourteen repetitions of one fact. Grouping collapses agreement to a single row
   * and makes disagreement the thing that takes up space.
   */
  get valueRows(): ValueRow[] {
    const rows: ValueRow[] = [];
    for (const row of this.rows) {
      const byValue = new Map<string, string[]>();
      row.cells.forEach((cell, index) => {
        if (cell && cell.state === 'SET') {
          const value = cell.value ?? '';
          const servers = byValue.get(value) ?? [];
          servers.push(this.servers[index]);
          byValue.set(value, servers);
        }
      });
      if (byValue.size === 0) {
        continue;
      }
      const groups: ValueGroup[] = [];
      byValue.forEach((servers, value) => groups.push({value, servers}));
      groups.sort((a, b) => b.servers.length - a.servers.length);
      rows.push({name: row.name, secure: row.secure, groups, drifts: groups.length > 1});
    }
    return rows;
  }

  /**
   * Long enough that printing it whole costs more than it explains.
   *
   * CEDAR_TERMINOLOGY_LOCAL_ONTOLOGIES is nine hundred comma-separated ontology acronyms. Rendered in
   * full it took fifteen lines and pushed every other variable off the screen, so the table stopped
   * being a table.
   */
  isLong(value: string): boolean {
    return value.length > LONG_VALUE_CHARS;
  }

  /** How many comma-separated items a long value holds — usually the only thing worth knowing about it. */
  itemCount(value: string): number {
    return value.split(',').filter(part => part.trim().length > 0).length;
  }

  preview(value: string): string {
    return value.substring(0, LONG_VALUE_CHARS).trimEnd();
  }

  valueKey(name: string, index: number): string {
    return `${name}#${index}`;
  }

  isOpen(key: string): boolean {
    return this.opened.has(key);
  }

  toggleValue(key: string): void {
    if (this.opened.has(key)) {
      this.opened.delete(key);
    } else {
      this.opened.add(key);
    }
  }

  get visibleValueRows(): ValueRow[] {
    const needle = this.filter.trim().toUpperCase();
    return this.valueRows.filter(row => {
      if (needle && !row.name.includes(needle)) {
        return false;
      }
      return !this.onlyFindings || row.drifts;
    });
  }

  /** The non-server components, as column headers. */
  get declarationComponents(): string[] {
    return this.declarations.map(d => d.component);
  }

  /**
   * Whether a component declares this variable — the only thing a declaration column can say.
   *
   * A build that finished last week has no resolved value to report, so these cells carry a tick
   * rather than a value, and the page says so above them. Rendering a tick in the same grid as a
   * value would read as though the frontends resolved something.
   */
  declares(component: string, name: string): boolean {
    const found = this.declarations.find(d => d.component === component);
    return !!found && found.variables.some(v => v.name === name);
  }

  /**
   * The grid says which components hold a variable, not what they hold.
   *
   * Values belong in the table below: they are long, mostly identical across the fifteen services, and
   * putting them in the grid made it four screens wide to show a column of repeated hostnames. A glyph
   * per state keeps all four states legible in a column narrow enough that every component fits at once,
   * which is what makes a gap visible as a gap.
   */
  stateGlyph(cell: EnvironmentVariableEntry | null): string {
    if (!cell) {
      return '';
    }
    switch (cell.state) {
      case 'SET':
        return '✓';
      case 'USING_DEFAULT':
        return '·';
      case 'DECLARED_BUT_UNSET':
        return '✗';
      default:
        return cell.presentInHostEnvironment ? '' : '';
    }
  }

  /** What a cell shows: the value where there is one, and otherwise why there is not. */
  cellText(cell: EnvironmentVariableEntry | null): string {
    if (!cell) {
      return '—';
    }
    switch (cell.state) {
      case 'SET':
        return cell.value === '' ? '(empty)' : (cell.value ?? '');
      case 'DECLARED_BUT_UNSET':
        return 'UNSET';
      case 'USING_DEFAULT':
        return 'default';
      case 'NOT_DECLARED':
        return cell.presentInHostEnvironment ? '· (on host)' : '·';
      default:
        return '';
    }
  }

  cellClass(cell: EnvironmentVariableEntry | null): string {
    if (!cell) {
      return 'cell-noanswer';
    }
    const state: VariableState = cell.state;
    if (state === 'DECLARED_BUT_UNSET') {
      return 'cell-unset';
    }
    if (state === 'USING_DEFAULT') {
      return 'cell-default';
    }
    if (state === 'NOT_DECLARED') {
      return 'cell-undeclared';
    }
    return cell.secure ? 'cell-secure' : 'cell-set';
  }

  cellTitle(cell: EnvironmentVariableEntry | null, server: string): string {
    if (!cell) {
      return `${server} did not answer`;
    }
    if (cell.state === 'SET') {
      return cell.secure
        ? `${server}: ${cell.value} (masked — the variable is flagged secret)`
        : `${server}: ${cell.value}`;
    }
    if (cell.state === 'DECLARED_BUT_UNSET') {
      return `${server} declares ${cell.name} but the environment supplied no value`;
    }
    if (cell.state === 'USING_DEFAULT') {
      return `${server} declares ${cell.name} as optional and the environment supplied no value, `
        + `so it is running on the default built into the code that reads it`;
    }
    return cell.presentInHostEnvironment
      ? `${server} does not declare ${cell.name}, so its configuration is built without it — even though the host sets it`
      : `${server} does not declare ${cell.name}`;
  }
}

/**
 * Turns fifteen per-server reports into one row per variable.
 *
 * Drift is judged only across servers that actually declare the variable. Counting an undeclared
 * server as a differing value would mark almost every variable as drifting, since by design most
 * variables are read by only a few services.
 */
/** Beyond this many characters a value is collapsed behind a count. */
const LONG_VALUE_CHARS = 140;

/** One value, and the services that reported it. */
interface ValueGroup {
  value: string;
  servers: string[];
}

interface ValueRow {
  name: string;
  secure: boolean;
  groups: ValueGroup[];
  drifts: boolean;
}

/** Every variable name declared by any non-server component. */
function declaredNames(declarations: ComponentDeclarations[]): Set<string> {
  const names = new Set<string>();
  for (const component of declarations) {
    for (const variable of component.variables) {
      names.add(variable.name);
    }
  }
  return names;
}

function buildRows(results: ServerResult<EnvironmentReport>[], declaredElsewhere: Set<string>): MatrixRow[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    for (const variable of result.data?.variables ?? []) {
      if (!seen.has(variable.name)) {
        seen.add(variable.name);
        names.push(variable.name);
      }
    }
  }

  const byServer = results.map(result => {
    const index = new Map<string, EnvironmentVariableEntry>();
    for (const variable of result.data?.variables ?? []) {
      index.set(variable.name, variable);
    }
    return {answered: result.data !== null, index};
  });

  return names.map(name => {
    const cells = byServer.map(server => server.answered ? (server.index.get(name) ?? null) : null);
    const declared = cells.filter((cell): cell is EnvironmentVariableEntry =>
      cell !== null && cell.state !== 'NOT_DECLARED');

    const distinct = new Set(declared.filter(cell => cell.state === 'SET').map(cell => cell.value ?? ''));
    const first = cells.find(cell => cell !== null) ?? null;

    return {
      name,
      secure: first?.secure ?? false,
      type: first?.type ?? 'STRING',
      cells,
      drifts: distinct.size > 1,
      missing: declared.length > 0 && declared.every(cell => cell.state === 'DECLARED_BUT_UNSET'),
      unused: declared.length === 0
        && !declaredElsewhere.has(name)
        && cells.some(cell => cell?.presentInHostEnvironment === true)
    };
  });
}
