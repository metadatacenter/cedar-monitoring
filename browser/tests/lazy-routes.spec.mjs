import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { test, expect } from '@playwright/test';
import { openMonitor } from './monitor-fixture.mjs';

const stats = JSON.parse(readFileSync(new URL('../../cedar-monitoring-src/dist/cedar-monitoring/browser-stats.json', import.meta.url)));
const diagnostics = Object.entries(stats.outputs).find(([, output]) => output.entryPoint?.endsWith('/resources.module.ts'))?.[0];

test('diagnostic screens load only after leaving the dashboard', async ({ page }) => {
  expect(diagnostics).toBeTruthy();
  await openMonitor(page, {});
  const scripts = new Set();
  page.on('request', request => { if (request.resourceType() === 'script') scripts.add(basename(new URL(request.url()).pathname)); });
  await page.goto('/');
  await expect(page.locator('.dash-card').first()).toBeVisible();
  // A preload starts once the first navigation ends, or once the page is idle. Let the page go idle, then
  // send a request of its own: it reaches the listener after every request the page sent before it.
  await page.evaluate(() => new Promise((resolve) => {
    const idle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 1));
    idle(() => idle(resolve));
  }));
  await Promise.all([
    page.waitForRequest((request) => new URL(request.url()).pathname === '/requests-reported'),
    page.evaluate(() => fetch('/requests-reported').then(() => undefined, () => undefined)),
  ]);
  expect(scripts.has(basename(diagnostics))).toBe(false);
  await page.goto('/profile');
  await expect(page.locator('.profile-card')).toBeVisible();
  expect(scripts.has(basename(diagnostics))).toBe(true);
});
