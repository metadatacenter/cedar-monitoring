import { test, expect } from '@playwright/test';
import { openMonitor, logsExplorer, fixture, byServer, settled } from './monitor-fixture.mjs';

test('informational emphasis does not inherit disabled-control opacity', async ({ page }) => {
  await openMonitor(page, { 'mysql/counts': fixture('mysql-counts') });
  await page.goto('/mysql-counts');
  const element = page.locator('.count-note').first();
  await expect(element).toBeVisible();
  await settled(page);
  await page.addStyleTag({ content: ':root { --cedar-control-disabled-opacity: 0.1; }' });
  await expect(element).toHaveCSS('opacity', '0.75');
  await page.addStyleTag({ content: ':root { --cedar-monitor-count-note-opacity: 0.83; }' });
  await expect(element).toHaveCSS('opacity', '0.83');
});

// A filter chip's remove button rests at full colour, which its icon needs to reach 3:1 against the
// chip, and neither the disabled-control opacity nor its former role fades it.
test('filter removal rests at full colour', async ({ page }) => {
  await openMonitor(page, logsExplorer);
  const filters = new URLSearchParams({ f: JSON.stringify([{ col: 'handler', op: 'eq', val: 'TemplatesResource' }]) });
  await page.goto('/logs-explorer?' + filters);
  const remove = page.locator('.chip .x').first();
  await expect(remove).toBeVisible();
  await settled(page);
  await page.addStyleTag({ content: ':root { --cedar-control-disabled-opacity: 0.1; --cedar-monitor-filter-remove-opacity: 0.3; }' });
  await expect(remove).toHaveCSS('opacity', '1');
  await expect(remove).toBeEnabled();
  await remove.click();
  await expect(page.locator('.chip .x')).toHaveCount(0);
});

// An unreachable service and an empty value read quieter through the muted text colour. Fading them
// took their text below 4.5:1, so neither the disabled-control opacity nor their former roles apply.
test('unreachable services and empty values take the muted text colour, not an opacity', async ({ page }) => {
  await openMonitor(page, {
    'server-report/:server/environment': byServer('environments'),
    'environment-model/declarations': fixture('environment-declarations'),
    'environment-model/unmodelled': fixture('environment-unmodelled'),
    'server-report/:server/insight': ({ server }) => server === 'worker' ? 503 : fixture('insights')[server] ?? 503,
    'server-report/:server/build': ({ server }) => server === 'worker' ? 503 : fixture('builds')[server] ?? 503,
    'host/git': fixture('host-git'),
  });
  for (const [route, selector, role] of [
    ['/environment', '.empty-value', 'empty-value'],
    ['/jvm', 'tr.absent-row th.name', 'service-unreachable'],
    ['/deploy', 'tr.absent-row th.name', 'build-unavailable'],
  ]) {
    await page.goto(route);
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();
    await settled(page);
    await page.addStyleTag({
      content: `:root { --cedar-control-disabled-opacity: 0.1; --cedar-monitor-${role}-opacity: 0.3; --cedar-text-muted: #345678; }`,
    });
    await expect(element).toHaveCSS('color', 'rgb(52, 86, 120)');
    for (const faded of [element, element.locator('xpath=..')]) await expect(faded).toHaveCSS('opacity', '1');
  }
});

test('copy feedback keeps its own colors and appears only after copying', async ({ page }) => {
  await openMonitor(page, logsExplorer);
  await page.context().grantPermissions(['clipboard-write']);
  await page.clock.install();
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await expect(page.locator('.toast')).toHaveCount(0);
  // The clock is paused before the copy, so the toast stays up through the colour checks however long
  // they take. It leaves when the clock reaches 1.5 s after the copy, and not before.
  await page.clock.pauseAt(Date.now() + 1000);
  await page.locator('tr.main').first().getByRole('cell', { name: 'resource', exact: true }).click();
  await expect(page.locator('.toast')).toHaveText('Copied component');
  await page.addStyleTag({ content: ':root { --cedar-color-primary: #123456; --cedar-color-on-primary: #234567; }' });
  await expect(page.locator('.toast')).toHaveCSS('background-color', 'rgb(33, 48, 63)');
  await expect(page.locator('.toast')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.addStyleTag({ content: ':root { --cedar-monitor-copy-toast-surface: #345678; --cedar-monitor-copy-toast-text: #fedcba; }' });
  await expect(page.locator('.toast')).toHaveCSS('background-color', 'rgb(52, 86, 120)');
  await expect(page.locator('.toast')).toHaveCSS('color', 'rgb(254, 220, 186)');
  await page.clock.runFor(1499);
  await expect(page.locator('.toast')).toHaveText('Copied component');
  await page.clock.runFor(1);
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
