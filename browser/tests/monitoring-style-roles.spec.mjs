import { test, expect } from '@playwright/test';
import { openMonitor, logsExplorer, fixture, byServer, settled } from './monitor-fixture.mjs';

test('informational emphasis and filter removal do not inherit disabled-control opacity', async ({ page }) => {
  await openMonitor(page, {
    ...logsExplorer,
    'server-report/:server/environment': byServer('environments'),
    'environment-model/declarations': fixture('environment-declarations'),
    'environment-model/unmodelled': fixture('environment-unmodelled'),
    'server-report/:server/insight': ({ server }) => server === 'worker' ? 503 : fixture('insights')[server] ?? 503,
    'server-report/:server/build': ({ server }) => server === 'worker' ? 503 : fixture('builds')[server] ?? 503,
    'host/git': fixture('host-git'),
    'mysql/counts': fixture('mysql-counts'),
  });
  const filters = new URLSearchParams({ f: JSON.stringify([{ col: 'handler', op: 'eq', val: 'TemplatesResource' }]) });
  for (const [route, selector, role, opacity] of [
    ['/logs-explorer?' + filters, '.chip .x', 'filter-remove', '0.55'],
    ['/environment', '.empty-value', 'empty-value', '0.6'],
    ['/jvm', 'tr.absent-row', 'service-unreachable', '0.6'],
    ['/deploy', 'tr.absent-row', 'build-unavailable', '0.6'],
    ['/mysql-counts', '.count-note', 'count-note', '0.75'],
  ]) {
    await page.goto(route);
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();
    await settled(page);
    await page.addStyleTag({ content: ':root { --cedar-control-disabled-opacity: 0.1; }' });
    await expect(element).toHaveCSS('opacity', opacity);
    await page.addStyleTag({ content: `:root { --cedar-monitor-${role}-opacity: 0.83; }` });
    await expect(element).toHaveCSS('opacity', '0.83');
    if (role === 'filter-remove') {
      await expect(element).toBeEnabled();
      await element.hover();
      await expect(element).toHaveCSS('opacity', '1');
      await element.click();
      await expect(page.locator(selector)).toHaveCount(0);
    }
  }
});

test('copy feedback keeps its own colors and appears only after copying', async ({ page }) => {
  await openMonitor(page, logsExplorer);
  await page.context().grantPermissions(['clipboard-write']);
  await page.clock.install();
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await expect(page.locator('.toast')).toHaveCount(0);
  await page.locator('tr.main').first().getByRole('cell', { name: 'resource', exact: true }).click();
  await expect(page.locator('.toast')).toHaveText('Copied component');
  await page.addStyleTag({ content: ':root { --cedar-color-primary: #123456; --cedar-color-on-primary: #234567; }' });
  await expect(page.locator('.toast')).toHaveCSS('background-color', 'rgb(33, 48, 63)');
  await expect(page.locator('.toast')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.addStyleTag({ content: ':root { --cedar-monitor-copy-toast-surface: #345678; --cedar-monitor-copy-toast-text: #fedcba; }' });
  await expect(page.locator('.toast')).toHaveCSS('background-color', 'rgb(52, 86, 120)');
  await expect(page.locator('.toast')).toHaveCSS('color', 'rgb(254, 220, 186)');
  await page.clock.runFor(1800);
  await expect(page.locator('.toast')).toHaveCount(0);
});

test('method, trace and masked-secret colors are independent of status and action roles', async ({ page }) => {
  await openMonitor(page, {
    ...logsExplorer,
    'server-report/:server/environment': byServer('environments'),
    'environment-model/declarations': fixture('environment-declarations'),
    'environment-model/unmodelled': fixture('environment-unmodelled'),
  });
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  const methodColors = () => page.locator('.method').evaluateAll(elements =>
    elements.map(element => getComputedStyle(element).color));
  const original = await methodColors();
  await page.addStyleTag({ content: `:root {
    --cedar-color-primary: #123456;
    --cedar-status-warning-text: #234567;
    --cedar-status-error-text: #345678;
  }` });
  expect(await methodColors()).toEqual(original);
  await page.addStyleTag({ content: ':root { --cedar-monitor-http-post-text: #456789; }' });
  await expect(page.locator('.m-post').first()).toHaveCSS('color', 'rgb(69, 103, 137)');
  await expect(page.locator('.m-get').first()).toHaveCSS('color', original[0]);
  await expect(page.locator('.m-put')).toHaveCSS('color', original[2]);
  await expect(page.locator('.m-delete')).toHaveCSS('color', original[5]);

  await page.locator('tr.main').nth(1).locator('td').first().click();
  await page.getByRole('button', { name: 'open trace →' }).click();
  await expect(page.locator('.tracepane .wrow')).toHaveCount(5);
  await expect(page.locator('.wkind.k-cypher').first()).toHaveCSS('color', 'rgb(107, 79, 196)');
  await expect(page.locator('.wkind:not(.k-cypher)').first()).toHaveCSS('color', 'rgb(15, 118, 134)');
  await page.addStyleTag({ content: ':root { --cedar-monitor-trace-cypher-text: #56789a; }' });
  await expect(page.locator('.wkind.k-cypher').first()).toHaveCSS('color', 'rgb(86, 120, 154)');
  await expect(page.locator('.wbar.b-cypher').first()).toHaveCSS('background-color', 'rgb(140, 116, 216)');
  await expect(page.locator('.m-post').first()).toHaveCSS('color', 'rgb(69, 103, 137)');

  await page.goto('/environment');
  await expect(page.locator('.unmodelled')).toBeVisible();
  await settled(page);
  await page.getByLabel('Filter by name').fill('PASSWORD');
  await expect(page.locator('td.vval.secret').first()).toHaveCSS('color', 'rgb(105, 65, 198)');
  await page.addStyleTag({ content: ':root { --cedar-monitor-masked-secret-text: #6789ab; }' });
  await expect(page.locator('td.vval.secret').first()).toHaveCSS('color', 'rgb(103, 137, 171)');
});
