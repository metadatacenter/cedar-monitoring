import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { extraStates, facets, onPausedClock, scenarios } from './scenarios.mjs';

/**
 * Automated WCAG checks over every state the browser suites reach.
 *
 * The rules are every rule axe-core tags for WCAG 2.0, 2.1 and 2.2 at levels A and AA, as in the
 * gates of Workspace, the designer, the term picker and CEE. Label in Name, WCAG 2.1's criterion
 * 2.5.3, needs a control's accessible name to contain the text it shows. axe-core's rule for it is
 * experimental, and a tag selection leaves experimental rules out, so the scan enables it by name.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const LABEL_IN_NAME = 'label-content-name-mismatch';

/**
 * axe's verdict on the page: the rules that fail, and the results it could not decide. Material's
 * menus and tooltips fade in, so the scan waits for every animation to finish and reads contrast at
 * full opacity.
 */
async function audit(page, { include } = {}) {
  // ResizeObserver supplies scroll-region semantics on the next rendering turn. Scan the painted
  // report, after fonts and those observers settle, rather than an intermediate DOM snapshot.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  // axe-core lets a rule enabled by name override the tag selection, so one scan covers both. The
  // builder's `options` replaces every option set before it, so it comes ahead of `withTags`.
  const builder = new AxeBuilder({ page })
    .options({ rules: { [LABEL_IN_NAME]: { enabled: true } } })
    .withTags(WCAG);
  if (include) builder.include(include);
  const scan = await builder.analyze();
  // A builder that dropped the rule option would stop checking Label in Name and fail nothing.
  const evaluated = [scan.passes, scan.violations, scan.incomplete, scan.inapplicable].flat();
  expect(evaluated.some((result) => result.id === LABEL_IN_NAME), `${LABEL_IN_NAME} did not run`).toBe(true);
  const nodes = (results) => results.flatMap((result) => result.nodes.map((node) => ({ rule: result.id, node })));
  return { violations: nodes(scan.violations), undecided: nodes(scan.incomplete) };
}

/** The sizes the surface contracts check every scenario at. A state is wide unless it says otherwise. */
const WIDE = { width: 1440, height: 1000 };
const NARROW = { width: 375, height: 1000 };

/**
 * Each state the gate scans. A state may return the part of the page the scan takes, and whether its
 * clock is paused. Every scenario the surface contracts open is a state, at both of their widths.
 */
const states = {};
for (const [name, open] of Object.entries(scenarios)) {
  const scenario = async (page) => {
    await open(page);
    await facets(page);
    // The scan takes the toast alone, on the paused clock that holds it. The page behind it is the
    // log explorer's own state.
    if (name === 'copy-confirmation') return { include: '.toast', paused: true };
    // A native modal makes the underlying report inert; that report has its own complete scan.
    if (name === 'request-trace') return { include: 'dialog.scrim' };
  };
  states[name] = scenario;
  states[`narrow ${name}`] = async (page) => {
    await page.setViewportSize(NARROW);
    return scenario(page);
  };
}
Object.assign(states, extraStates);

/**
 * One control of each kind, found in the state that shows it, and whether the pointer resting on it
 * opens a tooltip. Each is scanned once with the pointer resting on it and once focused from the
 * keyboard, since both change how it is drawn.
 */
const controls = {
  'icon button': [states.dashboard, (page) => page.getByRole('button', { name: 'Home', exact: true })],
  link: [states.dashboard, (page) => page.getByRole('link', { name: /^CEDAR Monitoring View/ })],
  card: [states.dashboard, (page) => page.locator('.dash-card').first()],
  'menu item': [states['user-menu'], (page) => page.getByRole('menuitem', { name: 'Profile' })],
  'raised button': [states['no-access'], (page) => page.getByRole('button', { name: 'Check again' })],
  'text button': [states['resource-info'], (page) => page.getByRole('button', { name: 'LOOK UP' })],
  'text box': [states['resource-info'], (page) => page.getByRole('textbox', { name: 'Resource id' })],
  'panel header': [states['resource-info'], (page) => page.locator('mat-expansion-panel-header').first()],
  board: [states['logs-explorer'], (page) => page.getByRole('button', { name: 'Slow endpoints', exact: true })],
  segment: [states['logs-explorer'], (page) => page.getByRole('button', { name: 'Requests', exact: true })],
  'link button': [states['logs-explorer'], (page) => page.getByRole('button', { name: 'Reload', exact: true })],
  select: [states['logs-explorer'], (page) => page.getByRole('combobox', { name: 'Min duration' })],
  'search box': [states['logs-explorer'], (page) => page.getByPlaceholder('path contains…')],
  'filter removal': [states['log explorer filter'], (page) => page.getByRole('button', { name: 'Remove filter' })],
  checkbox: [states.jvm, (page) => page.getByRole('checkbox'), { tooltip: true }],
};
for (const [kind, [open, find, { tooltip } = {}]] of Object.entries(controls)) {
  states[`hovered ${kind}`] = async (page) => {
    await open(page);
    const control = find(page);
    await control.hover();
    await expect.poll(() => control.evaluate((element) => element.matches(':hover'))).toBe(true);
    if (tooltip) await expect(page.locator('.mat-mdc-tooltip')).toBeVisible();
  };
  states[`focused ${kind}`] = async (page) => {
    await open(page);
    const control = find(page);
    // A key press first, so focus is drawn as it is for someone using the keyboard.
    await page.keyboard.press(kind === 'menu item' ? 'ArrowDown' : 'Tab');
    await control.focus();
    await expect.poll(() => control.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  };
}

/** An axe target without the attributes Angular names after a build's components. */
const normalized = (node) => node.target.join(' ').replace(/\[_ng(content|host)-[^\]]*\]/g, '');
const element = (page, node) => page.locator('css=' + node.target.join(' ')).first();

/**
 * The lowest contrast between a text's colour and what is painted under the parts of it that show,
 * as WCAG computes it, or null when none of it shows. Two screenshots of the element, with its text
 * and with its text transparent, give where the glyphs are and the background at each. A pixel
 * counts as a glyph's only when the text changes it markedly. Repainting can shift what is drawn over
 * the text by a level or two, and an edge the glyph barely covers says nothing its core does not.
 * Glyphs something opaque covers are drawn in neither screenshot, so they do not count. Workspace's
 * gate measures the same way.
 */
async function textContrast(page, text) {
  // Text a scroll container holds out of view, as a narrow window's tables do, is scrolled into view
  // for the measurement and put back afterwards.
  const scrolled = await text.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const within = (area) =>
      box.left >= area.left && box.top >= area.top && box.right <= area.right && box.bottom <= area.bottom;
    let shown = within({ left: 0, top: 0, right: innerWidth, bottom: innerHeight });
    for (let node = element.parentElement; node && shown; node = node.parentElement)
      if (getComputedStyle(node).overflow !== 'visible') shown = within(node.getBoundingClientRect());
    if (shown) return false;
    const positions = [];
    for (let node = element.parentElement; node; node = node.parentElement)
      positions.push([node, node.scrollLeft, node.scrollTop]);
    window.__contrastScroll = { positions, x: scrollX, y: scrollY };
    // Keep glyphs clear of clipped viewport/container edges while measuring their painted pixels.
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    return true;
  });
  // Firefox can paint the pre-scroll position once before settling. A one-pixel shift of an
  // adjacent icon between the pair would be misread as text against itself (1:1 contrast).
  const painted = () => page.evaluate(() =>
    new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await painted();
  const box = await text.boundingBox();
  const clip = {
    x: Math.floor(box.x),
    y: Math.floor(box.y),
    width: Math.ceil(box.x + box.width) - Math.floor(box.x),
    height: Math.ceil(box.y + box.height) - Math.floor(box.y),
  };
  const shot = async () => {
    await painted();
    return page.screenshot({ clip, animations: 'disabled', caret: 'hide', scale: 'css' });
  };
  const color = await text.evaluate((element) => getComputedStyle(element).color);
  const shown = await shot();
  await text.evaluate((element) => {
    element.dataset.contrastProbe = element.style.cssText;
    element.style.setProperty('color', 'transparent', 'important');
    element.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
  });
  const hidden = await shot();
  await text.evaluate((element) => {
    element.style.cssText = element.dataset.contrastProbe;
    delete element.dataset.contrastProbe;
  });
  if (scrolled)
    await page.evaluate(() => {
      const { positions, x, y } = window.__contrastScroll;
      for (const [node, left, top] of positions) [node.scrollLeft, node.scrollTop] = [left, top];
      scrollTo(x, y);
      delete window.__contrastScroll;
    });
  return page.evaluate(
    async ({ shown, hidden, color }) => {
      const pixels = async (png) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + png;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const canvas = new OffscreenCanvas(1, 1).getContext('2d');
      canvas.fillStyle = color;
      canvas.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
      const luminance = (channels) =>
        channels
          .map((value) => value / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
          .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const [withText, without] = await Promise.all([pixels(shown), pixels(hidden)]);
      let lowest = Infinity;
      for (let i = 0; i < withText.length; i += 4) {
        if ([0, 1, 2].every((channel) => Math.abs(withText[i + channel] - without[i + channel]) < 32)) continue;
        const background = [without[i], without[i + 1], without[i + 2]];
        const foreground = [r, g, b].map((value, channel) => (value * a + background[channel] * (255 - a)) / 255);
        const [light, dark] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
        lowest = Math.min(lowest, (light + 0.05) / (dark + 0.05));
      }
      return lowest === Infinity ? null : Math.floor(lowest * 100) / 100;
    },
    { shown: shown.toString('base64'), hidden: hidden.toString('base64'), color },
  );
}

/** How each rule's undecided result is measured. Each returns what it measured, or fails. */
const measures = {
  'color-contrast': async (page, node) => {
    const ratio = await textContrast(page, element(page, node));
    if (ratio === null) return 'none of it shows';
    const required = parseFloat(node.any[0]?.data?.expectedContrastRatio ?? '4.5');
    expect(ratio, `${normalized(node)} measures below ${required}:1`).toBeGreaterThanOrEqual(required);
    return `${ratio.toFixed(2)}:1`;
  },
  // A target is measured by its size. One under 24 px would need its spacing measured instead.
  'target-size': async (page, node) => {
    const box = await element(page, node).boundingBox();
    expect(Math.min(box.width, box.height), `${normalized(node)} is under 24 px`).toBeGreaterThanOrEqual(24);
    return `${Math.round(box.width)} × ${Math.round(box.height)} px`;
  },
  'aria-valid-attr-value': (page, node) =>
    element(page, node).evaluate((control) =>
      control
        .getAttribute('aria-controls')
        .split(/\s+/)
        .map((id) => {
          const target = document.getElementById(id);
          return target ? `${target.getAttribute('role') ?? target.localName} #${id}` : `missing #${id}`;
        })
        .join(', '),
    ),
  'th-has-data-cells': (page, node) =>
    element(page, node).evaluate((table) => `${table.querySelectorAll('tbody tr').length} rows`),
};

/** Whether an overlay matching `selector` spans the window and the element at `node` lies outside it. */
const behind = (page, node, selector) =>
  element(page, node).evaluate((found, selector) => {
    const overlay = document.querySelector(selector);
    if (!overlay || overlay.contains(found)) return false;
    const box = overlay.getBoundingClientRect();
    return box.left <= 0 && box.top <= 0 && box.right >= innerWidth && box.bottom >= innerHeight;
  }, selector);

/** The states that show the open user menu. */
const userMenu = ['user-menu', 'narrow user-menu', 'hovered menu item', 'focused menu item'];

/**
 * Results axe could not decide, each settled by a measurement every scan takes again. axe gives up
 * on text an overlay lies over, on text cut at the edge of its container or of the window, and on
 * a symbol, and it asks for review of a menu button that names its menu and of a table with no rows.
 * An entry settles a result when its element matches `target` in one of `states`, and the result
 * still fails unless the measurement passes: a contrast at least the ratio axe requires, measured
 * where the glyphs are drawn, or the value `expect` gives. An entry with `behind` settles text an
 * overlay spanning the window lies over. `measured` records what was measured on 2026-11-11.
 *
 * An undecided result no entry settles fails, and so does an entry none of its states produces, so
 * the list says exactly what the gate has settled.
 */
const SETTLED = [
  {
    rule: 'color-contrast',
    target: '.state-chip',
    browsers: ['webkit'],
    platforms: ['darwin'],
    states: ['search-index', 'narrow search-index'],
    measured: '5.30:1',
    reason:
      'macOS WebKit leaves the rounded state chip undecided; its rendered white text on the primary fill is measured again.',
  },
  {
    rule: 'color-contrast',
    target: '.comp',
    browsers: ['webkit'],
    platforms: ['darwin'],
    states: ['logs-usage'],
    measured: '5.95:1',
    reason: 'macOS WebKit leaves the component badges undecided; their rendered text and fill are measured again.',
  },
  {
    rule: 'color-contrast',
    target: '.tblwrap th[title]',
    browsers: ['webkit'],
    platforms: ['darwin'],
    states: [
      'logs-explorer',
      'log explorer board',
      'log explorer filter',
      'log explorer facet',
      'log explorer cypher',
      'log explorer row detail',
      'hovered board',
      'focused board',
      'hovered segment',
      'focused segment',
      'hovered link button',
      'focused link button',
      'hovered select',
      'focused select',
      'hovered search box',
      'focused search box',
      'hovered filter removal',
      'focused filter removal',
    ],
    measured: '7.45:1',
    reason:
      'macOS WebKit leaves the sticky table headers undecided; the screenshot probe measures text against the actual header fill.',
  },
  {
    rule: 'aria-valid-attr-value',
    target: '.mat-mdc-menu-trigger',
    states: userMenu,
    expect: 'menu #mat-menu-panel-0',
    reason: "axe cannot tell whether a menu button's aria-controls names its menu. The User button names the open menu.",
  },
  {
    rule: 'color-contrast',
    target: '.mat-mdc-menu-item-text > span',
    states: userMenu,
    measured: '5.30:1; the hovered item 4.91:1',
    reason:
      "The open menu lies in an overlay above the page, and axe cannot tell what is behind its items. Each item's text meets 4.5:1 against the menu, the hovered item's against its hover fill.",
  },
  {
    rule: 'color-contrast',
    target: '.mat-mdc-tooltip-surface',
    states: ['column help', 'hovered checkbox'],
    measured: '10.04:1',
    reason:
      'A tooltip lies in an overlay above the page, and axe cannot tell what is behind it. Its text meets 4.5:1 against its own surface.',
  },
  {
    rule: 'color-contrast',
    target: '.table-scroll *, .tblwrap *, .vsrv > span',
    states: [
      'narrow deploy', 'narrow host-disk', 'narrow jvm', 'narrow worker-lag', 'narrow logs-usage', 'narrow logs-explorer',
      'narrow environment',
    ],
    measured: "4.62:1 at the least, the worker lag's warning cell",
    reason:
      'In a narrow window each table scrolls sideways in its container, and axe cannot tell what lies behind text the container cuts. Scrolled into view, each text meets 4.5:1 against its row.',
  },
  {
    rule: 'color-contrast',
    target: 'p.col-note',
    states: ['narrow environment'],
    measured: '6.87:1',
    reason:
      "In a narrow window the column note runs below the window's lower edge, and axe cannot tell what lies behind the part out of view. Scrolled into view, it meets 4.5:1 against the card.",
  },
  {
    rule: 'color-contrast',
    target: '.k-unset',
    states: ['environment', 'narrow environment'],
    measured: '6.06:1',
    reason:
      'The cross that marks a variable declared and supplied with nothing is a symbol, which axe does not judge as text. It meets 4.5:1 against the note as text would.',
  },
  {
    rule: 'color-contrast',
    target: 'mat-form-field.search input',
    states: ['environment', 'narrow environment', 'environment failed'],
    expect: 'none of it shows',
    reason:
      'The empty filter box draws no text until it is focused, and its label lies over it, so axe cannot tell what is behind the box. The label is judged in its own right.',
  },
  {
    rule: 'th-has-data-cells',
    target: 'table.matrix, table.values',
    states: ['environment failed'],
    expect: '0 rows',
    reason:
      'With no service answering, the environment tables hold their headers and no rows, and axe cannot tell whether a header over an empty body describes anything. Rows arrive with the first service that answers.',
  },
];

/**
 * Findings that only a visible change can fix, whether axe fails them or measurement does. An entry
 * gives the `rule`, a `target` selector the element matches, the `states` that produce it, what was
 * `measured` and the visible change it `needs`, and the gate passes on it until that change is made.
 * An entry none of its states produces fails, so a fix must remove its entry.
 */
const EXCEPTIONS = [];

/** Whether the element at an axe node matches a selector. */
const matches = (page, node, selector) =>
  element(page, node).evaluate((found, selector) => found.matches(selector), selector);

/** Whether an entry applies to `state`. */
const applies = (entry, state) =>
  entry.states.includes(state) &&
  (!entry.platforms || entry.platforms.includes(process.platform)) &&
  (!entry.browsers || entry.browsers.includes(test.info().project.use.browserName));

/** The first entry of `list` that applies to `state`, names `rule` and whose target the result's element matches. */
async function entryFor(page, list, state, rule, node) {
  for (const entry of list)
    if (
      entry.rule === rule &&
      applies(entry, state) &&
      (await matches(page, node, entry.target)) &&
      (!entry.behind || (await behind(page, node, entry.behind)))
    )
      return entry;
  return undefined;
}

/**
 * Fail on any violation and on any undecided result the settled list does not settle, unless an
 * exception records it, and fail on any entry of either list that `state` names and no longer produces.
 */
async function judge(page, state, { violations, undecided }) {
  const failures = [];
  const used = new Set();
  for (const { rule, node } of violations) {
    const exception = await entryFor(page, EXCEPTIONS, state, rule, node);
    if (exception) used.add(exception);
    else failures.push(`${rule} ${normalized(node)}: ${node.failureSummary}`);
  }
  for (const { rule, node } of undecided) {
    const entry = await entryFor(page, SETTLED, state, rule, node);
    if (entry) {
      used.add(entry);
      // The overlay check that matched an entry with `behind` is its measurement.
      if (entry.behind) continue;
      const measured = await measures[rule](page, node);
      if (entry.expect) expect(measured, `${rule} ${normalized(node)}`).toBe(entry.expect);
      // A contrast entry settles text, so a result with no glyph to measure is not one it settles.
      else if (rule === 'color-contrast') expect(measured, `${normalized(node)} has no text to measure`).toMatch(/:1$/);
      continue;
    }
    const exception = await entryFor(page, EXCEPTIONS, state, rule, node);
    if (exception) {
      used.add(exception);
      continue;
    }
    const text = ((await element(page, node).textContent()) ?? '').trim().slice(0, 40);
    const measured = measures[rule]
      ? await measures[rule](page, node).catch((error) => error.message.split('\n')[0])
      : 'no measure';
    failures.push(`undecided ${rule} ${normalized(node)} “${text}” measures ${measured}`);
  }
  expect(failures, `${state}: findings no entry records`).toEqual([]);
  const stale = [...SETTLED, ...EXCEPTIONS].filter((entry) => applies(entry, state) && !used.has(entry));
  expect(stale.map((entry) => `${entry.rule} ${entry.target}`), `entries ${state} no longer produces`).toEqual([]);
}

for (const [name, state] of Object.entries(states))
  test(`accessible ${name}`, async ({ page }) => {
    // A narrow window's tables leave dozens of undecided results, each measured from two screenshots.
    if (name.startsWith('narrow ')) test.slow();
    await page.setViewportSize(WIDE);
    const scope = (await state(page)) ?? {};
    const check = async () => {
      const verdict = await audit(page, scope);
      // A scan confined to an element that left during it would pass on nothing.
      if (scope.include) await expect(page.locator(scope.include)).toBeVisible();
      await judge(page, name, verdict);
    };
    // Pixel measurements also need real animation frames while the toast's clock remains paused.
    if (scope.paused) await onPausedClock(page, check);
    else await check();
  });

/** The colour a shared role resolves to on this page. */
const role = (page, property) =>
  page.evaluate((property) => {
    const probe = document.body.appendChild(document.createElement('span'));
    probe.style.color = `var(${property})`;
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, property);

/** The opacity an element is drawn at: its own times that of every ancestor. */
const drawnOpacity = (locator) =>
  locator.evaluate((element) => {
    let opacity = 1;
    for (let node = element; node; node = node.parentElement) opacity *= parseFloat(getComputedStyle(node).opacity);
    return opacity;
  });

// A service that did not answer and a variable present but empty read quieter than the rest through
// the muted text colour, not by fading, so their text keeps 4.5:1.
for (const [name, selector] of [
  ['deploy failed', 'tr.absent-row > *'],
  ['jvm failed', 'tr.absent-row > *'],
  ['environment', '.empty-value'],
])
  test(`${name}: quieter text in the muted colour at 4.5:1`, async ({ page }) => {
    // Every text is measured, from two screenshots each.
    test.slow();
    await page.setViewportSize(WIDE);
    await states[name](page);
    const muted = await role(page, '--cedar-text-muted');
    const texts = await page.locator(selector).all();
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(await drawnOpacity(text)).toBe(1);
      await expect(text).toHaveCSS('color', muted);
      expect(await textContrast(page, text)).toBeGreaterThanOrEqual(4.5);
    }
  });

// The focused field's label takes the role for primary text on a tint, with the pointer away from
// the field and resting on it.
for (const pointer of ['away', 'on the field'])
  test(`a focused field's label reaches 4.5:1 with the pointer ${pointer}`, async ({ page }) => {
    await page.setViewportSize(WIDE);
    await scenarios['resource-info'](page);
    const field = page.getByRole('textbox', { name: 'Resource id' });
    if (pointer === 'away') await page.mouse.move(1, 1);
    else await field.hover();
    await page.keyboard.press('Tab');
    await field.focus();
    const label = page.locator('mat-form-field.mat-focused mat-label');
    await expect(label).toHaveCSS('color', await role(page, '--cedar-color-primary-strong'));
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    expect(await textContrast(page, label)).toBeGreaterThanOrEqual(4.5);
  });

/** Press Tab until `target` has focus, and say whether it did before focus came round again. */
async function tabsTo(page, target) {
  await page.evaluate(() => document.activeElement?.blur());
  const seen = new Set();
  for (let step = 0; step < 200; step++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return true;
    const active = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element.dataset.tabProbe) element.dataset.tabProbe = String(Math.random());
      return element.dataset.tabProbe;
    });
    if (seen.has(active)) return false;
    seen.add(active);
  }
  return false;
}

// A table's scroll container takes a Tab stop, a name and the shared focus ring while its table
// overflows it, and gives them up when the table fits. The check follows the window and the content.
test('a table scroll container is a Tab stop only while it overflows', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await states.deploy(page);
  const scroller = page.locator('.table-scroll').first();
  const region = page.getByRole('region', { name: 'Services', exact: true });
  await expect(region).toHaveCount(1);
  expect(await tabsTo(page, scroller)).toBe(true);
  await expect.poll(() => scroller.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await expect(scroller).toHaveCSS('outline-style', 'solid');
  await expect(scroller).toHaveCSS('outline-width', '2px');
  await expect(scroller).toHaveCSS('outline-color', await role(page, '--cedar-color-primary'));

  await page.setViewportSize(WIDE);
  await expect(scroller).not.toHaveAttribute('tabindex');
  await expect(page.getByRole('region')).toHaveCount(0);
  expect(await tabsTo(page, scroller)).toBe(false);

  // Content wider than the container makes it overflow again, and removing it makes it fit.
  await scroller.evaluate((element) => {
    const wide = element.appendChild(document.createElement('div'));
    wide.id = 'wide-probe';
    wide.style.width = '4000px';
  });
  await expect(scroller).toHaveAttribute('tabindex', '0');
  await page.locator('#wide-probe').evaluate((element) => element.remove());
  await expect(scroller).not.toHaveAttribute('tabindex');

  await page.setViewportSize(NARROW);
  await expect(scroller).toHaveAttribute('tabindex', '0');
  await expect(region).toHaveCount(1);
});

// The trace waterfall is a table. Under its column headers each span gives its start and duration
// as text, though the start shows only as where the bar begins. The values are the trace fixture's.
test("the trace waterfall exposes its headers and each span's start and duration", async ({ page }) => {
  await page.setViewportSize(WIDE);
  await states['request-trace'](page);
  const table = page.getByRole('table', { name: 'Spans of this request, timed from its start' });
  await expect(table.getByRole('columnheader')).toHaveText(['Kind', 'Component', 'Handler or query', 'Start', 'Duration']);
  const rows = table.getByRole('row').filter({ has: page.getByRole('cell') });
  const spans = [
    ['0ms', '182.7ms'],
    ['6.1ms', '22.4ms'],
    ['31.8ms', '48.2ms'],
    ['96.4ms', '61ms'],
    ['101.2ms', '12.6ms'],
  ];
  await expect(rows).toHaveCount(spans.length);
  for (const [index, [start, duration]] of spans.entries()) {
    const cells = rows.nth(index).getByRole('cell');
    await expect(cells).toHaveCount(5);
    await expect(cells.nth(3)).toHaveText(start);
    await expect(cells.nth(4)).toHaveText(duration);
  }
});

// The profile fields are a description list with nothing to open. No identifier repeats, every
// reference resolves, and a click changes nothing.
test('the profile page carries unique identifiers', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await states.profile(page);
  await expect(page.locator('mat-expansion-panel')).toHaveCount(0);
  await expect(page.locator('dl.profile-fields > .profile-field')).toHaveCount(6);
  await expect(page.locator('dl.profile-fields dt')).toHaveCount(6);
  await expect(page.locator('dl.profile-fields dd')).toHaveCount(6);
  await expect(page.locator('.profile-fields [aria-expanded], .profile-fields button')).toHaveCount(0);
  const before = await page.locator('.profile-fields').boundingBox();
  await page.locator('.profile-field').first().click();
  expect(await page.locator('.profile-fields').boundingBox()).toEqual(before);
  const { repeated, unresolved } = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    const references = [...document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')].flatMap(
      (element) =>
        ['aria-controls', 'aria-labelledby', 'aria-describedby'].flatMap((name) =>
          (element.getAttribute(name) ?? '').split(/\s+/).filter(Boolean),
        ),
    );
    return {
      repeated: ids.filter((id, index) => ids.indexOf(id) !== index),
      unresolved: references.filter((id) => document.querySelectorAll(`[id="${id}"]`).length !== 1),
    };
  });
  expect(repeated).toEqual([]);
  expect(unresolved).toEqual([]);
});

// These roles are an announcement contract; actual speech is checked by the manual protocol.
test('copy confirmation updates a persistent status region', async ({ page }) => {
  await scenarios['logs-explorer'](page);
  await expect(page.getByRole('status', { name: 'Copy confirmation' })).toHaveText('');
  await scenarios['copy-confirmation'](page);
  await expect(page.getByRole('status', { name: 'Copy confirmation' })).toHaveText('Copied component');
});

test('rebuild status, progress and read failures expose their semantics', async ({ page }) => {
  await scenarios['search-index'](page);
  await expect(page.getByRole('status')).toContainText('RUNNING');
  const progress = page.getByRole('progressbar', { name: 'Search index rebuild' });
  await expect(progress).toHaveAttribute('aria-valuemin', '0');
  await expect(progress).toHaveAttribute('aria-valuemax', '100');
  await expect(progress).toHaveAttribute('aria-valuenow', /\d/);
  await extraStates['search index failed'](page);
  await expect(page.getByRole('alert')).toHaveText('Could not read the search index status (HTTP 500).');
});
