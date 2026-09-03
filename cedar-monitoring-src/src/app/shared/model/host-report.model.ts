/**
 * What the box the monitoring server runs on looks like, from cedar-monitor-server /host/*.
 *
 * These describe one host rather than one service. In production that host is the application
 * server and the report covers all of CEDAR; under Docker it is the monitoring container alone.
 * `scope` says which, and the pages show it rather than letting a reader assume.
 */

export interface RepositoryState {
  repository: string;
  /** The checked-out branch, or "(detached)" when HEAD is not on one. */
  branch: string | null;
  commit: string | null;
  committedAt: string | null;
  /**
   * Tracked files differing from HEAD. Non-zero means a hot-patch applied directly on the box,
   * which the next pull would overwrite.
   */
  uncommittedFiles: number | null;
  ahead: number | null;
  behind: number | null;
  upstream: string | null;
  error: string | null;
}

export interface HostGitReport {
  scope: string;
  cedarHome: string | null;
  repositories: RepositoryState[];
}

export interface FilesystemUsage {
  path: string;
  totalBytes: number;
  usableBytes: number;
  usedPercent: number;
}

export interface LogFile {
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  /** Days since the last write. A large file still being written to is a log nothing is rotating. */
  ageDays: number;
}

export interface HostLogReport {
  directory: string | null;
  readable: boolean;
  fileCount: number;
  totalBytes: number;
  files: LogFile[];
  error?: string;
}

export interface HostDiskReport {
  scope: string;
  cedarHome: string | null;
  filesystems: FilesystemUsage[];
  logs: HostLogReport;
}
