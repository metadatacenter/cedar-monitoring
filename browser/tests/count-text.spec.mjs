import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { scenarios as states } from './scenarios.mjs';

// Monitoring states counts in English it writes into its templates. A count followed by a plural
// noun says "1 files" when the count is one, so every noun after a count goes through `noun`, which
// gives the singular for one. This reads the source, so it fails when a page states a count with a
// fixed plural again.

const SOURCE = new URL('../../cedar-monitoring-src/src/app/', import.meta.url).pathname;
// An expression that counts, as opposed to one that names a server, a table or a path.
const COUNTS = /count|length|total|checks|\bn\b/i;
const VERBS = new Set(['is', 'was', 'has', 'does', 'goes', 'as', 'its', 'this', 'declares']);

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name))
      : /\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [join(directory, entry.name)] : []);
}

test('no count is followed by a fixed plural noun', () => {
  const offenders = [];
  for (const file of files(SOURCE)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:\{\{([^}]*)\}\}|\$\{([^}]*)\})\s+([A-Za-z-]+)/g)) {
      const expression = match[1] ?? match[2];
      const word = match[3];
      if (COUNTS.test(expression) && /s$/.test(word) && !VERBS.has(word.toLowerCase()))
        offenders.push(`${file.slice(SOURCE.length)}: ${match[0].replace(/\s+/g, ' ')}`);
    }
  }
  expect(offenders).toEqual([]);
});

// A tile states its count in one element and the noun in another, so the source scan above cannot
// see them. This reads the rendered tiles. The fixture leaves one repository with uncommitted edits,
// so the singular is exercised, and every tile's noun must agree with its count.
test('a tile that counts uses the singular for one and the plural otherwise', async ({ page }) => {
  await states.deploy(page);
  const tiles = await page.locator('.tiles .tile').evaluateAll((all) => all.map((tile) => ({
    count: tile.querySelector('.tv')?.textContent?.trim() ?? '',
    noun: tile.querySelector('.td')?.textContent?.trim() ?? '',
  })));
  const agreement = tiles.filter((tile) => /^\d+$/.test(tile.count) && /^(service|repositor)/.test(tile.noun))
    .map((tile) => {
      const [singular, plural] = tile.noun.startsWith('service') ? ['service', 'services'] : ['repository', 'repositories'];
      return `${tile.count} ${tile.noun}` + (tile.noun === (tile.count === '1' ? singular : plural) ? '' : ' (wrong)');
    });
  expect(agreement.filter((line) => line.endsWith('(wrong)'))).toEqual([]);
  expect(agreement).toContain('1 repository');
});
