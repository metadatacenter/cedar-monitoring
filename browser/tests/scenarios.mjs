// The page states the browser suites open. `scenarios` holds those `.ui-surfaces.json` names, which
// the surface contracts walk, and `extraStates` those the accessibility and layout gates add. Each
// state is reached one way, whichever suite opens it.
import { expect } from '@playwright/test';
import {
  fixture, openMonitor, byServer, expectAllHealthChecksErrored, healthChecksWithOneError, settled, logsExplorer,
  templateId,
} from './monitor-fixture.mjs';

export const scenarios = {
  dashboard: async (page) => {
    await openMonitor(page, {});
    await page.goto('/');
    await expect(page.locator('.dash-card').first()).toBeVisible();
  },
  'user-menu': async (page) => {
    await scenarios.dashboard(page);
    await page.getByRole('button', { name: 'User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
  },
  'health-checks': async (page) => {
    await openMonitor(page, { 'health-check/:server': healthChecksWithOneError });
    await page.goto('/health-checks');
    await expect(page.getByRole('button', { name: '1 errored', exact: true })).toBeVisible();
    await settled(page);
  },
  profile: async (page) => {
    await openMonitor(page, {});
    await page.goto('/profile');
    await expect(page.locator('.profile-card')).toBeVisible();
  },
  // Signed in, but the monitor refuses: the user lacks MONITOR_READ.
  'no-access': async (page) => {
    await openMonitor(page, { 'health-check/monitor': 403 });
    await page.goto('/');
    await expect(page.locator('app-no-access')).toBeVisible();
  },
  // The page makes no request until an identifier is looked up.
  'resource-info': async (page) => {
    await openMonitor(page, {
      'command/resource-id-lookup': fixture('resource-id-lookup'),
      'resource/templates': fixture('resource-report-template'),
    });
    await page.goto('/resource-info');
    await page.getByRole('textbox', { name: 'Resource id' }).fill(templateId);
    await page.getByRole('button', { name: 'LOOK UP' }).click();
    await expect(page.locator('app-json-view')).toHaveCount(5);
    await settled(page);
  },
  'search-index': async (page) => {
    await openMonitor(page, { 'search-index/job-status': fixture('search-index-job-status') });
    await page.goto('/search-index');
    await expect(page.locator('.state-chip')).toHaveText('RUNNING');
    await settled(page);
  },
  'queue-counts': async (page) => {
    await openMonitor(page, { 'redis/queue-counts': fixture('redis-queue-counts') });
    await page.goto('/queue-counts');
    await expect(page.locator('.queue-attention').first()).toBeVisible();
    await settled(page);
  },
  'resource-counts': async (page) => {
    await openMonitor(page, { 'resources/counts': fixture('resource-counts') });
    await page.goto('/resource-counts');
    await expect(page.locator('.drift-summary')).toBeVisible();
    await settled(page);
  },
  'opensearch-counts': async (page) => {
    await openMonitor(page, { 'resources/counts/opensearch': fixture('resource-counts-opensearch') });
    await page.goto('/resource-counts/opensearch');
    await expect(page.getByRole('cell', { name: '143189' })).toBeVisible();
    await settled(page);
  },
  'mysql-counts': async (page) => {
    await openMonitor(page, { 'mysql/counts': fixture('mysql-counts') });
    await page.goto('/mysql-counts');
    await expect(page.getByRole('cell', { name: 'log_cypher' })).toBeVisible();
    await settled(page);
  },
  'logs-usage': async (page) => {
    await openMonitor(page, {
      'logs/usage/summary': fixture('logs-usage-summary'),
      'logs/usage/endpoints': fixture('logs-usage-endpoints'),
      'logs/usage/cypher': fixture('logs-usage-cypher'),
      'logs/usage/users': fixture('logs-usage-users'),
      'logs/usage/insights': fixture('logs-usage-insights'),
    });
    await page.goto('/logs-usage');
    await expect(page.locator('.insights')).toBeVisible();
    await settled(page);
  },
  'logs-explorer': async (page) => {
    await openMonitor(page, logsExplorer);
    await page.goto('/logs-explorer');
    await expect(page.locator('tr.main')).toHaveCount(6);
    await expect(page.locator('.caveat')).toBeVisible();
    await settled(page);
  },
  // A row opens from its caret, since a click on any other cell copies that cell's value, and the
  // row's trace opens from the detail beneath it.
  'request-trace': async (page) => {
    await scenarios['logs-explorer'](page);
    await page.locator('tr.main').nth(1).locator('td').first().click();
    await page.getByRole('button', { name: 'open trace →' }).click();
    await expect(page.locator('.tracepane .wrow')).toHaveCount(5);
  },
  // A click on a cell copies its value, and a toast confirms the copy for a second and a half. The
  // clock is paused once the page has settled, so the toast stays up for the walk. A script keeps the
  // page's own timers for `onPausedClock`. Context scripts run in the order they are added, so it is
  // added before the clock.
  'copy-confirmation': async (page) => {
    await page.context().grantPermissions(['clipboard-write']);
    await page.context().addInitScript(keepTimers, TIMERS);
    await page.clock.install();
    await scenarios['logs-explorer'](page);
    await page.clock.pauseAt(Date.now() + 1000);
    await page.locator('tr.main').first().getByRole('cell', { name: 'resource', exact: true }).click();
    await expect(page.locator('.toast')).toHaveText('Copied component');
  },
  environment: async (page) => {
    await openMonitor(page, {
      'server-report/:server/environment': byServer('environments'),
      'environment-model/declarations': fixture('environment-declarations'),
      'environment-model/unmodelled': fixture('environment-unmodelled'),
    });
    await page.goto('/environment');
    await expect(page.locator('.unmodelled')).toBeVisible();
    await settled(page);
  },
  deploy: async (page) => {
    await openMonitor(page, {
      'server-report/:server/build': byServer('builds'),
      'host/git': fixture('host-git'),
    });
    await page.goto('/deploy');
    await expect(page.getByRole('rowheader', { name: 'cedar-development' })).toBeVisible();
    await settled(page);
  },
  jvm: async (page) => {
    await openMonitor(page, { 'server-report/:server/insight': byServer('insights') });
    await page.goto('/jvm');
    await expect(page.locator('.fill.bar-bad')).toBeVisible();
    await settled(page);
  },
  configuration: async (page) => {
    await openMonitor(page, { 'server-report/:server/configuration': fixture('configuration') });
    await page.goto('/configuration');
    await expect(page.locator('app-json-view')).toBeVisible();
    await settled(page);
  },
  'host-disk': async (page) => {
    await openMonitor(page, { 'host/disk': fixture('host-disk') });
    await page.goto('/host-disk');
    await expect(page.locator('.fs')).toHaveCount(3);
    await settled(page);
  },
  'worker-lag': async (page) => {
    await openMonitor(page, { 'worker/lag': fixture('worker-lag') });
    await page.goto('/worker-lag');
    await expect(page.locator('.verdict')).toBeVisible();
    await settled(page);
  },
};

/** The timer functions the clock replaces. */
const TIMERS = [
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback',
];

/** Keep the page's own timer functions before the clock replaces them. */
function keepTimers(names) {
  window.__ownTimers = Object.fromEntries(names.map((name) => [name, window[name]]));
}

/**
 * Run `work` while the copy confirmation's paused clock stands still. axe-core and the layout checks
 * wait on timers and animation frames, which a paused clock holds. Advancing the clock until the work
 * is done would let as much time pass as the work takes, and on a busy machine the toast would leave
 * during it. The work runs on the page's own timers instead. The toast's timer stays on the clock,
 * which does not move, so the toast stays up however long the work takes.
 */
export async function onPausedClock(page, work) {
  await page.evaluate(() => {
    const own = window.__ownTimers;
    // Timers kept after the clock was installed would be the clock's, and the work would wait on them forever.
    if (!/\[native code\]/.test(String(own.setTimeout))) throw new Error("The page kept the clock's timers");
    window.__clockTimers = Object.fromEntries(Object.keys(own).map((name) => [name, window[name]]));
    Object.assign(window, own);
  });
  try {
    return await work();
  } finally {
    await page.evaluate(() => {
      Object.assign(window, window.__clockTimers);
      delete window.__clockTimers;
    });
  }
}

/**
 * Wait for the log explorer's facet values, which arrive after its first query and widen each
 * select. A scan taken while they arrive finds text that moved during the scan.
 */
export async function facets(page) {
  const component = page.locator('label.fld', { hasText: 'Component' });
  if (await component.count()) await expect(component.locator('option')).not.toHaveCount(1);
}

const FILTER = [{ col: 'handler', op: 'eq', val: 'TemplatesResource' }];
const FACET = [{ col: 'component', op: 'eq', val: 'resource' }];
/** The log explorer at the URL `query` gives, with `answers` in place of the fixture's. */
async function explorer(page, query = {}, answers = {}) {
  await openMonitor(page, { ...logsExplorer, ...answers });
  const search = new URLSearchParams(query).toString();
  await page.goto('/logs-explorer' + (search ? `?${search}` : ''));
  await settled(page);
  await facets(page);
}

/** A page whose every request is answered 500, as the response matrix opens it. */
async function failed(page, route, patterns) {
  await openMonitor(page, Object.fromEntries(patterns.map((pattern) => [pattern, 500])));
  await page.goto(route);
  await settled(page);
}

/**
 * The log explorer's states the URL matrix reaches, the pages the response matrix shows failing, and
 * the no-access and store-unavailable pages in the states their own specs leave them.
 */
export const extraStates = {
  'log explorer board': async (page) => {
    await explorer(page, { board: 'slow-endpoints' });
    await expect(page.locator('.boardhead b')).toHaveText('Slow endpoints');
    await settled(page);
  },
  'log explorer filter': async (page) => {
    await explorer(page, { f: JSON.stringify(FILTER) });
    await expect(page.getByRole('button', { name: 'Remove filter' })).toBeVisible();
  },
  'log explorer facet': async (page) => {
    await explorer(page, { f: JSON.stringify(FACET) });
    await expect(page.locator('label.fld', { hasText: 'Component' }).locator('select')).toHaveValue('resource');
  },
  'log explorer cypher': async (page) => {
    await explorer(page, { table: 'cypher' });
    await expect(page.locator('.seg button.on', { hasText: 'Cypher' })).toBeVisible();
  },
  // A row opens from its caret, since a click on any other cell copies that cell's value.
  'log explorer row detail': async (page) => {
    await scenarios['logs-explorer'](page);
    await page.locator('tr.main').nth(1).locator('td').first().click();
    await expect(page.locator('tr.detail')).toBeVisible();
  },
  'log explorer failed': async (page) => {
    await explorer(page, {}, { 'logs/query': 500 });
    await expect(page.locator('.banner.error')).toBeVisible();
  },
  'health checks failed': async (page) => {
    await failed(page, '/health-checks', ['health-check/:server']);
    await expectAllHealthChecksErrored(page);
  },
  'search index failed': async (page) => {
    await failed(page, '/search-index', ['search-index/job-status']);
    await expect(page.locator('.banner.error')).toBeVisible();
  },
  'mysql counts failed': async (page) => {
    await failed(page, '/mysql-counts', ['mysql/counts']);
    await expect(page.locator('.unreachable')).toBeVisible();
  },
  'environment failed': async (page) => {
    await failed(page, '/environment', [
      'server-report/:server/environment', 'environment-model/declarations', 'environment-model/unmodelled',
    ]);
    await expect(page.locator('.banner.warn')).toBeVisible();
  },
  'deploy failed': async (page) => {
    await failed(page, '/deploy', ['server-report/:server/build', 'host/git']);
    await expect(page.locator('.tile.warn').first()).toBeVisible();
  },
  'jvm failed': async (page) => {
    await failed(page, '/jvm', ['server-report/:server/insight']);
    await expect(page.locator('.tile.warn').first()).toBeVisible();
  },
  'no access checked again': async (page) => {
    await scenarios['no-access'](page);
    await page.getByRole('button', { name: 'Check again' }).click();
    await expect(page.getByText(/Still no access at/)).toBeVisible();
  },
  'store unavailable': async (page) => {
    const opensearch = { document: null, unavailable: 'OpenSearch could not be read: Connection refused' };
    await openMonitor(page, {
      'command/resource-id-lookup': fixture('resource-id-lookup'),
      'resource/templates': { ...fixture('resource-report-template'), opensearch },
    });
    await page.goto('/resource-info');
    await page.getByRole('textbox', { name: 'Resource id' }).fill(templateId);
    await page.getByRole('button', { name: 'LOOK UP' }).click();
    await expect(page.locator('app-json-view')).toHaveCount(5);
    await settled(page);
    const card = page.locator('app-json-view', { hasText: 'Opensearch' });
    await card.locator('mat-expansion-panel-header').click();
    await expect(card.locator('pre')).toContainText(opensearch.unavailable);
  },
  // A column header's help, which a tooltip shows.
  'column help': async (page) => {
    await scenarios['resource-counts'](page);
    await page.getByRole('columnheader', { name: 'Drift' }).hover();
    await expect(page.locator('.mat-mdc-tooltip')).toBeVisible();
  },
};
