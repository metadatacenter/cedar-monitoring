import { test, expect } from '@playwright/test';
import { openMonitor, logsExplorer, fixture, byServer, settled } from './monitor-fixture.mjs';

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
