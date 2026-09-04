import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {forkJoin} from 'rxjs';
import {ServerReportService} from '../../../../services/load-data/server-report.service';
import {HostReportService} from '../../../../services/load-data/host-report.service';
import {BuildReport, ServerResult} from '../../../../shared/model/server-report.model';
import {HostGitReport, RepositoryState} from '../../../../shared/model/host-report.model';

/** One service's row, with the two verdicts a deploy check is actually asking for. */
interface ServiceRow {
  server: string;
  build: BuildReport | null;
  error: string | null;
  /** The running JVM started before the artifact on disk was written: rebuilt, never restarted. */
  staleProcess: boolean;
  /** This service's version differs from the one most services report. */
  versionDrift: boolean;
}

@Component({
  selector: 'app-deploy-matrix',
  templateUrl: './deploy-matrix.component.html',
  styleUrls: ['./deploy-matrix.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DeployMatrixComponent implements OnInit {

  rows: ServiceRow[] = [];
  git: HostGitReport | null = null;
  gitError: string | null = null;

  loading = false;
  error: string | null = null;

  /** The version the majority of services report, which the rest are compared against. */
  expectedVersion: string | null = null;

  serviceColumns = ['server', 'version', 'artifactBuiltAt', 'startedAt', 'uptime', 'host', 'artifact'];
  repositoryColumns = ['repository', 'branch', 'commit', 'committedAt', 'uncommitted', 'distance'];

  constructor(private servers: ServerReportService, private host: HostReportService) {
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.gitError = null;
    forkJoin({
      builds: this.servers.allBuilds(),
      git: this.host.git()
    }).subscribe({
      next: r => {
        this.applyBuilds(r.builds);
        this.git = r.git;
        this.loading = false;
      },
      error: () => {
        // The git half is the one that can fail on its own — it reads the host's checkout, which a
        // containerised monitor does not have. Retry the builds alone rather than losing both.
        this.servers.allBuilds().subscribe({
          next: builds => {
            this.applyBuilds(builds);
            this.gitError = 'The host checkout could not be read.';
            this.loading = false;
          },
          error: () => {
            this.error = 'Could not reach the monitor API.';
            this.loading = false;
          }
        });
      }
    });
  }

  private applyBuilds(results: ServerResult<BuildReport>[]): void {
    this.expectedVersion = majorityVersion(results);
    this.rows = results.map(result => ({
      server: result.server,
      build: result.data,
      error: result.error,
      staleProcess: startedBeforeArtifact(result.data),
      versionDrift: this.expectedVersion !== null
        && result.data !== null
        && (result.data.version ?? null) !== this.expectedVersion
    }));
  }

  get answered(): ServiceRow[] {
    return this.rows.filter(row => row.build !== null);
  }

  get unreachableCount(): number {
    return this.rows.filter(row => row.build === null).length;
  }

  get versionDriftCount(): number {
    return this.rows.filter(row => row.versionDrift).length;
  }

  get staleProcessCount(): number {
    return this.rows.filter(row => row.staleProcess).length;
  }

  get repositories(): RepositoryState[] {
    return this.git?.repositories ?? [];
  }

  get hotPatched(): RepositoryState[] {
    return this.repositories.filter(repository => (repository.uncommittedFiles ?? 0) > 0);
  }

  /** Branches other than the one most repositories are on — usually a repo left on a feature branch. */
  get offBranch(): RepositoryState[] {
    const main = majorityBranch(this.repositories);
    if (main === null) {
      return [];
    }
    return this.repositories.filter(repository => repository.branch !== null && repository.branch !== main);
  }

  get majorityBranchName(): string | null {
    return majorityBranch(this.repositories);
  }

  shortCommit(commit: string | null): string {
    return commit ? commit.substring(0, 8) : '—';
  }

  /** Uptime as something readable at a glance; the exact millisecond count is not the question here. */
  uptime(ms: number | null): string {
    if (ms === null || ms === undefined) {
      return '—';
    }
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 48) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  fileName(path: string | null): string {
    if (!path) {
      return '—';
    }
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }
}

/**
 * The version most services agree on.
 *
 * A deploy leaves every service on the same version, so the interesting question is which services
 * are not on it — and that needs a reference. Taking the most common value rather than a configured
 * expectation means the page needs nothing told to it and still names the odd one out.
 */
function majorityVersion(results: ServerResult<BuildReport>[]): string | null {
  return majority(results.map(result => result.data?.version ?? null));
}

function majorityBranch(repositories: RepositoryState[]): string | null {
  return majority(repositories.map(repository => repository.branch));
}

function majority(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value !== null && value !== undefined) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  let winner: string | null = null;
  let best = 0;
  counts.forEach((count, value) => {
    if (count > best) {
      best = count;
      winner = value;
    }
  });
  return winner;
}

/**
 * Whether the running process predates the artifact it was loaded from.
 *
 * This is the deploy that looks like it worked: the build succeeded, the jar on disk is new, and the
 * JVM serving traffic is the one started before it. Nothing else on this page or the health page
 * shows it, because the old process is perfectly healthy.
 */
function startedBeforeArtifact(build: BuildReport | null): boolean {
  if (!build || !build.startedAt || !build.artifactBuiltAt) {
    return false;
  }
  const started = Date.parse(build.startedAt);
  const built = Date.parse(build.artifactBuiltAt);
  if (isNaN(started) || isNaN(built)) {
    return false;
  }
  return started < built;
}
