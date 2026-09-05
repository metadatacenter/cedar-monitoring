import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {HostReportService} from '../../../../services/load-data/host-report.service';
import {FilesystemUsage, HostDiskReport, LogFile} from '../../../../shared/model/host-report.model';

/** Above this share of a filesystem, the room left is the thing worth reading first. */
const DISK_WARNING_PERCENT = 80;
const DISK_CRITICAL_PERCENT = 90;

/**
 * Big enough that it is worth asking whether anything rotates it. A log file rotates daily under any
 * sane policy, so a file this size is either very busy or never rotated, and the age beside it says which.
 */
const LARGE_LOG_BYTES = 512 * 1024 * 1024;

@Component({
  selector: 'app-host-disk',
  templateUrl: './host-disk.component.html',
  styleUrls: ['./host-disk.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class HostDiskComponent implements OnInit {

  report: HostDiskReport | null = null;
  loading = false;
  error: string | null = null;

  readonly warningPercent = DISK_WARNING_PERCENT;

  constructor(private svc: HostReportService) {
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.svc.disk().subscribe({
      next: report => {
        this.report = report;
        this.loading = false;
      },
      error: e => {
        this.error = `Could not read the host report${e?.status ? ` (HTTP ${e.status})` : ''}.`;
        this.loading = false;
      }
    });
  }

  get filesystems(): FilesystemUsage[] {
    return this.report?.filesystems ?? [];
  }

  get logFiles(): LogFile[] {
    return this.report?.logs?.files ?? [];
  }

  get tightFilesystems(): FilesystemUsage[] {
    return this.filesystems.filter(fs => fs.usedPercent >= DISK_WARNING_PERCENT);
  }

  /**
   * Files large enough to be worth a look, and still being written to.
   *
   * Size on its own is not a finding — a big archived log is fine. Size plus recent writes is: it
   * means the file is the live one and nothing has rotated it away.
   */
  get unrotated(): LogFile[] {
    return this.logFiles.filter(file => file.sizeBytes >= LARGE_LOG_BYTES && file.ageDays <= 1);
  }

  usageClass(percent: number): string {
    if (percent >= DISK_CRITICAL_PERCENT) {
      return 'bar-bad';
    }
    return percent >= DISK_WARNING_PERCENT ? 'bar-warn' : 'bar-ok';
  }

  isLarge(file: LogFile): boolean {
    return file.sizeBytes >= LARGE_LOG_BYTES;
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
    return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
  }

  /** The path with the log directory prefix removed, so the table reads as file names rather than paths. */
  relative(path: string): string {
    const root = this.report?.logs?.directory;
    return root && path.startsWith(root) ? path.substring(root.length).replace(/^\//, '') : path;
  }
}
