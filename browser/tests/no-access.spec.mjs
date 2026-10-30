import { test, expect } from '@playwright/test';
import { byServer, openMonitor, settled } from './monitor-fixture.mjs';

// Signed in is not the same as allowed: every monitor route needs MONITOR_READ. A user without it is
// told so once, on its own page, instead of every page filling with refusals that read as outages.

const ROUTES = ['/', '/health-checks', '/queue-counts', '/logs-usage', '/worker-lag', '/host-disk'];

for (const answer of [401, 403])
  for (const route of ROUTES)
    test(`${route} sends a user the monitor refuses (${answer}) to the no-access page`, async ({ page }) => {
      await openMonitor(page, { 'health-check/:server': answer });
      await page.goto(route);
      await expect(page).toHaveURL(/\/no-access$/);
      await expect(page.locator('app-no-access')).toContainText('monitorManager');
    });

test('a monitor that is down does not lock the user out', async ({ page }) => {
  await openMonitor(page, { 'health-check/:server': 503 });
  await page.goto('/health-checks');
  await settled(page);
  await expect(page).toHaveURL(/\/health-checks$/);
  await expect(page.getByText('12 errored')).toBeVisible();
});

test('the profile stays readable without MONITOR_READ', async ({ page }) => {
  await openMonitor(page, { 'health-check/:server': 403 });
  await page.goto('/profile');
  await expect(page.locator('.profile-card')).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);
});

test('one refused service is unknown, not failing', async ({ page }) => {
  await openMonitor(page, {
    'health-check/:server': ({ server }) => (server === 'artifact' ? 403 : byServer('health-checks')({ server })),
  });
  await page.goto('/health-checks');
  await settled(page);
  const card = page.locator('mat-card.dash-card', { hasText: 'artifact' });
  await expect(card).toContainText('No access (403), health unknown');
  await expect(card.locator('mat-icon')).not.toHaveAttribute('color', 'warn');
});

test('check again lets the user in once the role is granted', async ({ page }) => {
  let granted = false;
  await openMonitor(page, {
    'health-check/:server': ({ server }) => (granted ? byServer('health-checks')({ server }) : 403),
  });
  await page.goto('/');
  await expect(page.locator('app-no-access')).toBeVisible();
  const button = page.getByRole('button', { name: 'Check again' });
  const before = await button.boundingBox();
  await button.click();
  await expect(page.getByText(/Still no access at/)).toBeVisible();
  // The status line was reserved: saying something does not move the button.
  expect(await button.boundingBox()).toEqual(before);
  granted = true;
  await button.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.dash-card').first()).toBeVisible();
});
