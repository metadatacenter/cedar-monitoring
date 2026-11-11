import { test, expect } from '@playwright/test';
import { extraStates, facets, onPausedClock, scenarios } from './scenarios.mjs';
import { VIEWPORTS, check } from './layout-resilience.generated.mjs';

/**
 * Whether Monitoring's pages survive a narrow window, a zoomed window and wider text, and whether
 * their placeholders, field boundaries, icons, focus indicators and selection marks can be seen.
 *
 * The checks are the shared ones the token package generates into `layout-resilience.generated.mjs`,
 * which says what WCAG asks and how each check measures it. This spec reaches each state the
 * accessibility gate scans and records what Monitoring excuses. A finding fails unless `EXCEPTIONS`
 * names it, and an exception no state produces fails too, so the list says exactly what remains.
 */

/**
 * Each state the checks open. A state may return the selector of the surface it is measured in, and
 * whether its clock is paused.
 */
const states = {};
for (const [name, open] of Object.entries(scenarios))
  states[name] = async (page) => {
    await open(page);
    await facets(page);
    // The checks measure the toast alone, on the paused clock that holds it. The page behind it is
    // the log explorer's own state.
    if (name === 'copy-confirmation') return { scope: '.toast', paused: true };
  };
Object.assign(states, extraStates);

/** The open trace's scrim, whose cover hides the page beneath until the trace closes. */
const overlays = ['.scrim'];

/** The log explorer's open board and its chosen table, range and source, which no ARIA state names. */
const selected = ['.rail .board.on', '.seg button.on'];

/** The log explorer's states that show its table of rows. */
const explorerTables = [
  'logs-explorer', 'request-trace', 'log explorer board', 'log explorer filter', 'log explorer facet',
  'log explorer cypher', 'log explorer row detail',
];

/**
 * Data tables that need scrolling in two dimensions, which may scroll sideways inside their own
 * container at 320 px rather than reflow, each in the states listed. Each container is a Tab stop,
 * named by its table's heading, while its table overflows it.
 */
const SCROLLS_IN_PLACE = [
  {
    selector: '.table-scroll',
    states: [
      'deploy', 'deploy failed', 'host-disk', 'jvm', 'jvm failed', 'worker-lag', 'environment', 'queue-counts',
      'resource-counts', 'column help', 'mysql-counts', 'resource-info', 'store unavailable',
    ],
    why: "A table of services, repositories, log files, log tables, variable values, counts or parsing phases, a row each with a column per measurement, which a narrow window scrolls inside its container.",
  },
  {
    selector: '.tblwrap',
    states: ['logs-usage', ...explorerTables],
    why: 'A table of endpoints, query shapes, users or log rows, a row each with a column per measurement, which a narrow window scrolls inside its container.',
  },
  {
    selector: '.matrix-scroll',
    states: ['environment'],
    why: 'The table of every variable against every service, fifteen columns wide by design, which scrolls inside its container at any width short of them.',
  },
];

/** The states that show the json-view panels. */
const panels = ['resource-info', 'store unavailable'];

/**
 * What the checks find that is left as it is, each with the visible change that would remove it.
 * Each entry gives its check, kind, selector, states and why, as `Exception` in the generated
 * declaration says.
 */
const EXCEPTIONS = [
  {
    check: 'reflow',
    kind: 'scrolls',
    selector: '.tracepane',
    states: ['request-trace'],
    why: "The trace waterfall is two-dimensional data: each row places a span's bar on one time axis that every row shares, so at 320 px the trace pane scrolls sideways in its own region rather than reflow, as 1.4.10 allows. The checker grants that allowance only to a region holding a table element, and the waterfall is drawn in div rows. Marking it up as a table, drawn as now, would let `SCROLLS_IN_PLACE` declare it instead.",
  },
  {
    check: 'indicators',
    kind: 'focus',
    selector: 'mat-form-field.resource-id-form-field textarea',
    states: panels,
    why: "The checker's finding, not the page's: no visible change is needed. A focused filled field draws a 2px primary line in `.mdc-line-ripple::after`, which the checker reads in the field around a control when that field is at most 48px wider. With text in it, this field shows its Clear button, which takes the field 68px wider than the box, so the line is not read.",
  },
];

/** Each layout check by the name its tests carry. */
const conditions = { reflow: 'reflow', resize: 'resize', 'text spacing': 'spacing' };

/**
 * Reach `state` at the viewport `request` measures in, with the pointer away from every control, run
 * the check, and return its report. A check confined to a toast that left during it would pass on
 * nothing, so the toast must still show.
 */
async function measured(page, request) {
  await page.setViewportSize(VIEWPORTS[request.check]);
  const { scope = null, paused = false } = (await states[request.state](page)) ?? {};
  await page.mouse.move(0, 0);
  const run = () => check(page, expect, { ...request, scope, exceptions: EXCEPTIONS });
  const report = paused ? await onPausedClock(page, run) : await run();
  if (scope) await expect(page.locator(scope)).toBeVisible();
  return report;
}

for (const state of Object.keys(states)) {
  for (const [condition, name] of Object.entries(conditions))
    test(`${state} survives ${condition}`, async ({ page }) => {
      const request = { check: name, state };
      // Reach is measured at 320 px and at 640 by 400, and only reflow lets a table scroll in place.
      if (name !== 'spacing') request.overlays = overlays;
      if (name === 'reflow') request.scrollsInPlace = SCROLLS_IN_PLACE;
      const report = await measured(page, request);
      expect(report.measured.texts, 'texts measured').toBeGreaterThan(0);
    });

  test(`${state} draws its placeholders at 4.5:1`, async ({ page }) => {
    await measured(page, { check: 'placeholder', state });
  });

  test(`${state} draws its field boundaries at 3:1`, async ({ page }) => {
    await measured(page, { check: 'boundary', state });
  });

  test(`${state} draws its icons, focus indicators and selection marks at 3:1`, async ({ page }) => {
    await measured(page, { check: 'indicators', state, selected });
  });
}
