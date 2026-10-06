import { test, expect } from '@playwright/test';
import { fixture, openMonitor, settled, templateId } from './monitor-fixture.mjs';

// A diagnostic report puts each store's record of one resource side by side. A store the Monitor
// could not read used to leave only a null on its card, which is also what a store holding nothing
// gives, so an index that was down read as a template that had never been indexed. The report now
// says why beside the null, and the card must show that reason, show nothing more when the store
// holds nothing, and show the record when there is one.

const REASON = 'OpenSearch could not be read: Connection refused';

const OPENSEARCH = {
  'a document': fixture('resource-report-template').opensearch,
  'no document': { document: null },
  'an index that could not be read': { document: null, unavailable: REASON },
};

async function lookUp(page, report) {
  await openMonitor(page, {
    'command/resource-id-lookup': fixture('resource-id-lookup'),
    'resource/templates': report,
  });
  await page.goto('/resource-info');
  await page.getByRole('textbox', { name: 'Resource id' }).fill(templateId);
  await page.getByRole('button', { name: 'LOOK UP' }).click();
  await expect(page.locator('app-json-view')).toHaveCount(5);
  await settled(page);
  const card = page.locator('app-json-view', { hasText: 'Opensearch' });
  await card.locator('mat-expansion-panel-header').click();
  return card.locator('pre');
}

for (const [state, opensearch] of Object.entries(OPENSEARCH))
  test(`the OpenSearch card for ${state}`, async ({ page }) => {
    const shown = await lookUp(page, { ...fixture('resource-report-template'), opensearch });
    if (state === 'a document') {
      await expect(shown).toContainText('"summaryText": "Biosample"');
    } else if (state === 'no document') {
      await expect(shown).toHaveText('null');
    } else {
      await expect(shown).toContainText(REASON);
    }
  });
