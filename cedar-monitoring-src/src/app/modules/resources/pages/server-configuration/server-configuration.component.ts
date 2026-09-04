import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ServerReportService} from '../../../../services/load-data/server-report.service';
import {ConfigurationReport} from '../../../../shared/model/server-report.model';

/** A placeholder the substitution could not resolve, and where in the tree it survived. */
interface UnresolvedPlaceholder {
  path: string;
  value: string;
}

@Component({
  selector: 'app-server-configuration',
  templateUrl: './server-configuration.component.html',
  styleUrls: ['./server-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ServerConfigurationComponent implements OnInit {

  servers: string[] = [];
  server = '';

  report: ConfigurationReport | null = null;
  unresolved: UnresolvedPlaceholder[] = [];

  loading = false;
  error: string | null = null;

  constructor(private svc: ServerReportService) {
  }

  ngOnInit(): void {
    this.servers = this.svc.servers();
    this.server = this.servers.includes('resource') ? 'resource' : (this.servers[0] ?? '');
    this.reload();
  }

  selectServer(server: string): void {
    this.server = server;
    this.reload();
  }

  reload(): void {
    if (!this.server) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.report = null;
    this.unresolved = [];
    this.svc.configuration(this.server).subscribe({
      next: report => {
        this.report = report;
        this.unresolved = findPlaceholders(report.configuration);
        this.loading = false;
      },
      error: e => {
        this.error = e?.status === 404
          ? `${this.server} does not serve this route — it is running a build from before it existed.`
          : `Could not read ${this.server}'s configuration${e?.status ? ` (HTTP ${e.status})` : ''}.`;
        this.loading = false;
      }
    });
  }
}

/**
 * Every `${NAME}` the substitution left behind, with the path it sits at.
 *
 * The service leaves these literal rather than blanking them, because an unresolved placeholder is
 * the finding: blanked, it would be indistinguishable from a setting that is legitimately empty.
 * Collecting them here saves reading a few hundred lines of YAML to find the one that did not
 * resolve.
 */
function findPlaceholders(node: unknown, path = ''): UnresolvedPlaceholder[] {
  if (typeof node === 'string') {
    return /\$\{[^}]+}/.test(node) ? [{path: path || '(root)', value: node}] : [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((element, index) => findPlaceholders(element, `${path}[${index}]`));
  }
  if (node !== null && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>)
      .flatMap(([key, value]) => findPlaceholders(value, path ? `${path}.${key}` : key));
  }
  return [];
}
