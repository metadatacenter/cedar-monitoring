import { test, expect } from '@playwright/test';
import { fixture, logsExplorer, openMonitor, settled } from './monitor-fixture.mjs';

// The log explorer keeps its state in the URL, so a board or a set of filters is a link someone can
// send. Each parameter is opened absent, valid and invalid, on the plain table and on a board, with
// the board catalogue arriving after the first query as it does over a real network. The page must
// show what the URL asked for, query for it, and write the URL back as it came, less what it could
// not use. A shared board link used to open the plain table, because the first load rewrote the URL
// before the catalogue arrived to say which board it named.

const BOARD = 'slow-endpoints';
const FILTER = [{ col: 'handler', op: 'eq', val: 'TemplatesResource' }];
const FACET = [{ col: 'component', op: 'eq', val: 'resource' }];

// For each parameter: what the URL says, and what the page writes back, by value.
const PARAMETERS = {
  board: { valid: [BOARD, BOARD], invalid: ['no-such-board', undefined] },
  table: { valid: ['cypher', 'cypher'], invalid: ['bogus', undefined] },
  source: { valid: ['rollup', 'rollup'], invalid: ['bogus', undefined] },
  range: { valid: ['60', '60'], invalid: ['soon', undefined] },
  rows: { valid: ['500', '500'], invalid: ['7', undefined] },
  q: { valid: ['needle', 'needle'], invalid: ['   ', undefined] },
  minMs: { valid: ['500', '500'], invalid: ['slow', undefined] },
  f: { valid: [JSON.stringify(FILTER), JSON.stringify(FILTER)], invalid: ['{not json', undefined] },
  facet: { valid: [JSON.stringify(FACET), JSON.stringify(FACET)], invalid: ['[]', undefined] },
};

async function open(page, query) {
  const queries = [];
  await openMonitor(page, logsExplorer);
  // The catalogue answers late, after the first query has gone out and rewritten the URL.
  await page.route('**/logs/boards', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ json: fixture('logs-boards') });
  });
  page.on('request', (request) => {
    if (request.url().endsWith('/logs/query')) queries.push(request.postDataJSON());
  });
  const search = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined)).toString();
  const catalogue = page.waitForResponse('**/logs/boards');
  await page.goto('/logs-explorer' + (search ? `?${search}` : ''));
  await catalogue;
  return queries;
}

for (const mode of ['the plain table', 'a board'])
  for (const [name, values] of Object.entries(PARAMETERS))
    for (const kind of ['absent', 'valid', 'invalid']) {
      if (mode === 'a board' && (name === 'board' || name === 'f' || name === 'facet' || name === 'table')) continue;
      test(`${name} ${kind}, on ${mode}`, async ({ page }) => {
        const key = name === 'facet' ? 'f' : name;
        const [given, kept] = kind === 'absent' ? [undefined, undefined] : values[kind];
        const query = { ...(mode === 'a board' ? { board: BOARD } : {}), [key]: given };
        const queries = await open(page, query);
        const boardOpen = mode === 'a board' || (name === 'board' && kind === 'valid');
        if (boardOpen) await expect(page.locator('.boardhead b')).toHaveText('Slow endpoints');
        await settled(page);
        const expected = { ...(boardOpen ? { board: BOARD } : {}), ...(kept !== undefined ? { [key]: kept } : {}) };
        await expect.poll(() => Object.fromEntries(new URL(page.url()).searchParams)).toEqual(expected);
        if (!boardOpen) await expect(page.locator('.boardhead')).toHaveCount(0);
        // What the page asked for is what the URL said.
        const last = queries.at(-1);
        expect(last).toBeDefined();
        if (name === 'table' && kind === 'valid') expect(last.table).toBe('cypher');
        if (name === 'source' && kind === 'valid') expect(last.source).toBe('rollup');
        if (name === 'rows' && kind === 'valid' && !boardOpen) expect(last.limit).toBe(500);
        if ((name === 'f' || name === 'facet') && kind === 'valid')
          expect(last.filters).toEqual(expect.arrayContaining(JSON.parse(kept)));
        // A facet selection comes back as the facet's own choice, not as a filter chip.
        if (name === 'facet' && kind === 'valid') {
          await expect(page.locator('label.fld', { hasText: 'Component' }).locator('select')).toHaveValue('resource');
          await expect(page.locator('button[aria-label="Remove filter"]')).toHaveCount(0);
        }
      });
    }
