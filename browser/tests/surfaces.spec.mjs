import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { surfaceCases, checkSurface } from './surface-contracts.generated.mjs';
import { fixture, openMonitor, byServer, settled, logsExplorer, templateId } from './monitor-fixture.mjs';

const registry = JSON.parse(readFileSync(new URL('../../.ui-surfaces.json', import.meta.url), 'utf8'));
const scenarios = {
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
    await openMonitor(page, { 'health-check/:server': byServer('health-checks') });
    await page.goto('/health-checks');
    await expect(page.getByText('1 errored')).toBeVisible();
    await settled(page);
  },
  profile: async (page) => {
    await openMonitor(page, {});
    await page.goto('/profile');
    await expect(page.locator('.profile-card')).toBeVisible();
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
    await expect(page.getByRole('cell', { name: '141233' })).toBeVisible();
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
  // clock is paused once the page has settled, so the toast stays up for the walk.
  'copy-confirmation': async (page) => {
    await page.context().grantPermissions(['clipboard-write']);
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

for (const { surface, state, width, title } of surfaceCases(registry, scenarios))
  test(title, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await scenarios[surface.scenario](page);
    await expect(page.locator('app-header mat-toolbar')).toBeVisible();
    await checkSurface(page, surface, state, expect, testInfo);
  });
