import {test, expect} from '@playwright/test';
import {fixture, openMonitor, logsExplorer, healthChecksWithOneError, settled, byServer} from './monitor-fixture.mjs';

const tab = (page, backwards = false) => page.keyboard.press(
  `${backwards ? 'Shift+' : ''}${process.platform === 'darwin' && test.info().project.use.browserName === 'webkit' ? 'Alt+' : ''}Tab`);

async function openLogs(page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: {writeText: async text => {window.__copiedText = text;}}
  }));
  await openMonitor(page, logsExplorer);
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await settled(page);
}

test('environment value expansion retains its row and keyboard focus', async ({page}) => {
  const reports = fixture('environments');
  const value = Array.from({length: 30}, (_, index) => `ONTOLOGY_${index}`).join(',');
  for (const report of Object.values(reports)) {
    if (!report?.variables) continue;
    report.variables.push({name: 'CEDAR_TERMINOLOGY_LOCAL_ONTOLOGIES', state: 'SET', secure: false,
      type: 'STRING', value, presentInHostEnvironment: true});
  }
  await openMonitor(page, {
    'server-report/:server/environment': ({server}) => reports[server] ?? 503,
    'environment-model/declarations': fixture('environment-declarations'),
    'environment-model/unmodelled': fixture('environment-unmodelled'),
  });
  await page.goto('/environment');
  await expect(page.locator('.unmodelled')).toBeVisible();
  await settled(page);
  const button = page.locator('.values .more').first();
  const row = await button.evaluateHandle(element => element.closest('tr'));
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveText('Collapse');
  await expect(button).toBeFocused();
  expect(await row.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.locator('.values .long.open').first()).toHaveText(value);
  await page.keyboard.press('Space');
  await expect(button).toHaveText('Show all 30 items');
  await expect(button).toBeFocused();
  expect(await row.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.locator('.values .long.open')).toHaveCount(0);
});

async function traceFromKeyboard(page) {
  const expand = page.getByRole('button', {name: /^(Expand|Collapse) row 2$/});
  await expand.focus();
  await page.keyboard.press('Enter');
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
  const opener = page.getByRole('button', {name: 'open trace →'});
  // Follow actual application Tab order from the expanded row to its trace action.
  for (let step = 0; step < 40 && !(await opener.evaluate(node => node === document.activeElement)); step++) await tab(page);
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
  return opener;
}

test('log row expansion and full-value copy work with Enter and Space without changing table semantics', async ({page}) => {
  await openLogs(page);
  await page.screenshot({path: test.info().outputPath('normal-log-explorer.png')});
  const expand = page.getByRole('button', {name: /^(Expand|Collapse) row 1$/});
  await expand.focus(); await page.keyboard.press('Space');
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#log-detail-0')).toBeVisible();
  await tab(page);
  const firstCell = page.locator('tr.main').first().locator('td[data-copy]').first();
  await expect(firstCell.getByRole('button')).toBeFocused();
  await expect(firstCell.getByRole('button')).toHaveCSS('outline-style', 'solid');
  await expect(firstCell.getByRole('button')).toHaveCSS('outline-width', '2px');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__copiedText)).toBe(await firstCell.getAttribute('data-copy'));
  await expect(page.getByRole('status', {name: 'Copy confirmation'})).toContainText('Copied');
  await expect(firstCell).toHaveRole('cell');
  await expand.focus(); await page.keyboard.press('Enter');
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#log-detail-0')).toHaveCount(0);
});

test('trace dialog contains keyboard focus and returns it on Escape and close', async ({page}) => {
  await openLogs(page);
  const opener = await traceFromKeyboard(page);
  const dialog = page.getByRole('dialog', {name: 'Request trace'});
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', {name: 'close', exact: true});
  await expect(close).toBeFocused();
  await expect(dialog.locator('.wrow')).toHaveCount(5);
  await page.screenshot({path: test.info().outputPath('trace-dialog.png')});
  for (let step = 0; step < 8; step++) {
    await tab(page, step % 2 === 0);
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole('button', {name: 'copy id'}).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('status', {name: 'Copy confirmation'})).toHaveText('Copied request id');
  await expect(dialog.locator('.toast')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(close).toBeFocused();
  await page.keyboard.press('Space');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('closing a loading trace cancels it and a late answer does not reopen the dialog', async ({page}) => {
  await openLogs(page);
  let pending;
  await page.route('**/logs/trace/**', route => {pending = route;});
  const opener = await traceFromKeyboard(page);
  await expect(page.getByRole('status', {name: 'Trace query'})).toHaveText('Loading trace…');
  await expect.poll(() => !!pending).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await pending.fulfill({json: fixture('logs-trace')}).catch(() => {});
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('log queries announce loading, errors and repeated results without moving focus', async ({page}) => {
  await openLogs(page);
  const status = page.getByRole('status', {name: 'Log query', exact: true});
  const errors = page.getByRole('alert', {name: 'Log query error'});
  await expect(status).toHaveText('6 rows loaded. Page 1. More available.');
  const reload = page.getByRole('button', {name: 'Reload', exact: true});
  let pending;
  await page.route('**/logs/query', route => {pending = route;});
  await reload.focus(); await page.keyboard.press('Enter');
  await expect(status).toHaveText('Loading…');
  await expect(reload).toBeFocused();
  await expect.poll(() => !!pending).toBe(true);
  await pending.fulfill({status: 500, json: {message: 'Query unavailable'}});
  await expect(errors).toHaveText('Query unavailable');
  await expect(reload).toBeFocused();
  for (let repeat = 0; repeat < 2; repeat++) {
    pending = null;
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Loading…');
    await expect(errors).toBeEmpty();
    await expect.poll(() => !!pending).toBe(true);
    await pending.fulfill({json: fixture('logs-query')});
    await expect(status).toHaveText('6 rows loaded. Page 1. More available.');
    await expect(reload).toBeFocused();
  }
});

const reports = [
  {path: 'health-checks', seconds: 5, endpoint: '**/health-check/*', answers: {'health-check/:server': healthChecksWithOneError}, ready: '.button-row', content: '.button-row'},
  {path: 'queue-counts', seconds: 2, endpoint: '**/redis/queue-counts', answers: {'redis/queue-counts': fixture('redis-queue-counts')}, ready: '.queue-attention', content: '.counts-card'},
  {path: 'search-index', seconds: 3, endpoint: '**/search-index/job-status', answers: {'search-index/job-status': fixture('search-index-job-status')}, ready: '.state-chip', content: '.progress-block'}
];
for (const report of reports) {
  test(`${report.path}: pause, manual reload, resume and navigation keep a single refresh chain`, async ({page}) => {
    await openMonitor(page, report.answers);
    let reads = 0;
    page.on('request', request => {
      if (request.url().includes(report.path === 'health-checks' ? '/health-check/' : report.path === 'queue-counts' ? '/redis/queue-counts' : '/search-index/job-status')) reads++;
    });
    await page.goto('/' + report.path);
    await expect(page.locator(report.ready).first()).toBeVisible();
    await settled(page);
    await page.screenshot({path: test.info().outputPath('normal-report.png')});
    await page.clock.install();
    const toggle = page.getByRole('checkbox', {name: `Refresh every ${report.seconds}s`});
    await expect(toggle).toBeChecked();
    await toggle.focus(); await page.keyboard.press('Space');
    await expect(toggle).not.toBeChecked();
    const frozen = await page.locator(report.content).textContent();
    const pausedReads = reads;
    await page.clock.runFor(report.seconds * 3000);
    expect(reads).toBe(pausedReads);
    expect(await page.locator(report.content).textContent()).toBe(frozen);
    await page.getByRole('button', {name: 'Reload', exact: true}).click();
    await expect.poll(() => reads).toBeGreaterThan(pausedReads);
    await settled(page);
    const manualReads = reads;
    await page.clock.runFor(report.seconds * 3000);
    expect(reads).toBe(manualReads);
    await expect(toggle).not.toBeChecked();
    await toggle.focus(); await page.keyboard.press('Space');
    await expect.poll(() => reads).toBeGreaterThan(manualReads);
    await settled(page);
    await page.getByRole('button', {name: 'Home', exact: true}).click();
    await expect(page).toHaveURL(/\/$/);
    const awayReads = reads;
    await page.clock.runFor(report.seconds * 3000);
    expect(reads).toBe(awayReads);
  });
}

test('pausing an active rebuild freezes its progress and resuming shows completion without another POST', async ({page}) => {
  const initial = fixture('search-index-job-status');
  let status = initial;
  await openMonitor(page, {'search-index/job-status': () => status});
  let writes = 0;
  page.on('request', request => {if (request.method() === 'POST' && request.url().includes('/search-index/')) writes++;});
  await page.goto('/search-index');
  await expect(page.locator('.state-chip')).toHaveText('RUNNING');
  const toggle = page.getByRole('checkbox', {name: 'Refresh every 3s'});
  await toggle.uncheck();
  status = {...initial, SEARCH: {...initial.SEARCH, state: 'SUCCEEDED', finishedAt: '2026-11-12T12:00:00Z'}};
  await page.clock.install(); await page.clock.runFor(12000);
  await expect(page.locator('.state-chip')).toHaveText('RUNNING');
  await expect(page.getByRole('button', {name: 'Rebuild search index'})).toBeDisabled();
  await toggle.check();
  await expect(page.locator('.state-chip')).toHaveText('SUCCEEDED');
  expect(writes).toBe(0);
});


test('unchanged rebuild polls do not repeat the status announcement', async ({page}) => {
  await openMonitor(page, {'search-index/job-status': fixture('search-index-job-status')});
  await page.goto('/search-index');
  await expect(page.getByRole('status')).toContainText('RUNNING');
  await page.getByRole('status').evaluate(node => {
    window.__statusMutations = 0;
    new MutationObserver(records => window.__statusMutations += records.length)
      .observe(node, {subtree: true, childList: true, characterData: true});
  });
  await page.clock.install();
  for (let poll = 0; poll < 3; poll++) {
    const read = page.waitForResponse('**/search-index/job-status');
    await page.clock.runFor(3100);
    await read;
    await settled(page);
  }
  expect(await page.evaluate(() => window.__statusMutations)).toBe(0);
});

test('pausing cancels an in-flight report and retains the displayed values', async ({page}) => {
  await openMonitor(page, {'redis/queue-counts': fixture('redis-queue-counts')});
  await page.goto('/queue-counts');
  await expect(page.locator('.counts-card')).toBeVisible();
  await settled(page);
  const before = await page.locator('.counts-card').textContent();
  let pending;
  await page.route('**/redis/queue-counts', route => {pending = route;});
  await page.getByRole('button', {name: 'Reload', exact: true}).click();
  await expect.poll(() => !!pending).toBe(true);
  await page.getByRole('checkbox', {name: 'Refresh every 2s'}).uncheck();
  await pending.fulfill({json: {...fixture('redis-queue-counts'), appLog: 99999}}).catch(() => {});
  await settled(page);
  expect(await page.locator('.counts-card').textContent()).toBe(before);
});


for (const report of [
  {path: 'worker-lag', label: 'Refresh every 10s', endpoint: '**/worker/lag', answers: {'worker/lag': fixture('worker-lag')}, ready: '.verdict'},
  {path: 'jvm', label: 'Refresh every 30s', endpoint: '**/server-report/*/insight', answers: {'server-report/:server/insight': byServer('insights')}, ready: '.fill.bar-bad'}
]) test(`${report.path}: existing refresh control also cancels in-flight updates`, async ({page}) => {
  await openMonitor(page, report.answers);
  await page.goto('/' + report.path);
  await expect(page.locator(report.ready).first()).toBeVisible();
  await settled(page);
  const toggle = page.getByRole('checkbox', {name: report.label});
  await toggle.check();
  const before = await page.locator('mat-card-content').textContent();
  const pending = [];
  await page.route(report.endpoint, route => pending.push(route));
  await page.getByRole('button', {name: 'Reload', exact: true}).click();
  await expect.poll(() => pending.length).toBeGreaterThan(0);
  await toggle.uncheck();
  await Promise.all(pending.map(route => route.fulfill({status: 500, json: {}}).catch(() => {})));
  await settled(page);
  expect(await page.locator('mat-card-content').textContent()).toBe(before);
  await expect(page.locator('.banner.error')).toHaveCount(0);
});

test('a status read cannot re-enable rebuild while its start request is pending', async ({page}) => {
  const running = fixture('search-index-job-status');
  let status = {...running, SEARCH: {...running.SEARCH, state: 'IDLE', progress: null}};
  await openMonitor(page, {'search-index/job-status': () => status});
  let pending;
  await page.route('**/search-index/regenerate', route => {pending = route;});
  await page.goto('/search-index');
  const rebuild = page.getByRole('button', {name: /Rebuild search index|Starting…/});
  await expect(rebuild).toBeEnabled();
  await rebuild.click();
  await expect.poll(() => !!pending).toBe(true);
  const read = page.waitForResponse('**/search-index/job-status');
  await page.getByRole('button', {name: 'Reload', exact: true}).click();
  await read; await settled(page);
  await expect(rebuild).toBeDisabled();
  status = running;
  await pending.fulfill({status: 202, json: {}});
  await expect(page.locator('.state-chip')).toHaveText('RUNNING');
  await expect(rebuild).toBeDisabled();
});

test('refresh retains existing model defaults when a successful report omits values', async ({page}) => {
  await openMonitor(page, {'redis/queue-counts': {}, 'search-index/job-status': {}});
  await page.goto('/queue-counts');
  await expect(page.locator('.counts-card')).toBeVisible();
  await expect(page.getByRole('cell', {name: '-1', exact: true})).toHaveCount(9);
  await page.goto('/search-index');
  await expect(page.locator('.state-chip')).toHaveText('IDLE');
  await expect(page.getByText('No rebuild has run since this server started.')).toBeVisible();
});
