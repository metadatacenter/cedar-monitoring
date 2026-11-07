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
  expect(scripts.has(basename(diagnostics))).toBe(false);
  await page.goto('/profile');
  await expect(page.locator('.profile-card')).toBeVisible();
  expect(scripts.has(basename(diagnostics))).toBe(true);
});
