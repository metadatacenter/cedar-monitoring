import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { surfaceCases, checkSurface } from './surface-contracts.generated.mjs';
import { scenarios } from './scenarios.mjs';

const registry = JSON.parse(readFileSync(new URL('../../.ui-surfaces.json', import.meta.url), 'utf8'));

for (const { surface, state, width, title } of surfaceCases(registry, scenarios))
  test(title, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await scenarios[surface.scenario](page);
    await expect(page.locator('app-header mat-toolbar')).toBeVisible();
    await checkSurface(page, surface, state, expect, testInfo);
  });
