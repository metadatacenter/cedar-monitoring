import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openMonitor, logsExplorer, settled } from './monitor-fixture.mjs';
import { checkSurface } from './surface-contracts.generated.mjs';

const registry = JSON.parse(readFileSync(new URL('../../.ui-surfaces.json', import.meta.url), 'utf8'));
const surface = registry.surfaces.find(({ id }) => id === 'monitoring.logs-explorer');

test('scoped roles honor overrides and reject the same color on unrelated text', async ({ page }, testInfo) => {
  await openMonitor(page, logsExplorer);
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await settled(page);
  await page.addStyleTag({ content: ':root { --cedar-monitor-http-post-text: #456789; }' });
  await checkSurface(page, surface, 'open', expect, testInfo);
  await page.locator('app-root').evaluate((root) => {
    const text = document.createElement('p');
    text.textContent = 'Unrelated label';
    text.style.color = '#456789';
    root.append(text);
  });
  await expect(checkSurface(page, surface, 'open', expect, testInfo)).rejects.toThrow(/outside the shared vocabulary/);
});

test('a registered role cannot be replaced with a different valid shared color', async ({ page }, testInfo) => {
  await openMonitor(page, logsExplorer);
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await settled(page);
  await page.addStyleTag({ content: '.method.m-post { color: var(--cedar-color-primary) !important; }' });
  await expect(checkSurface(page, surface, 'open', expect, testInfo)).rejects.toThrow(/registered central roles/);
});

test('unused literal allowances and unexercised role selectors fail', async ({ page }, testInfo) => {
  await openMonitor(page, logsExplorer);
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await settled(page);
  await expect(checkSurface(page, { ...surface, scaleDebt: [
    { property: 'color', value: 'rgb(1, 2, 3)', reason: 'An allowance no longer used by this fixture' },
  ] }, 'open', expect, testInfo)).rejects.toThrow(/unused scale debt/);
  await expect(checkSurface(page, { ...surface, scaleRoles: [
    ...surface.scaleRoles, { selector: '.missing-toast', role: 'monitor-copy-toast' },
  ] }, 'open', expect, testInfo)).rejects.toThrow(/selectors must be exercised/);
});

test('native select corners stay native while custom off-scale corners fail', async ({page}, testInfo) => {
  await openMonitor(page, logsExplorer);
  await page.goto('/logs-explorer');
  await expect(page.locator('tr.main')).toHaveCount(6);
  await settled(page);
  await checkSurface(page, surface, 'open', expect, testInfo);
  await page.addStyleTag({content: 'select { appearance: none !important; border-radius: 7px !important; }'});
  await expect(checkSurface(page, surface, 'open', expect, testInfo)).rejects.toThrow(/outside the shared vocabulary/);
});
