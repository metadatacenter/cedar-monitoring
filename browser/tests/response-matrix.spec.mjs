import { test, expect } from '@playwright/test';
import { NETWORK_FAILURE, byServer, fixture, logsExplorer, openMonitor, settled, templateId } from './monitor-fixture.mjs';

// Each Monitoring page against each answer the monitor API can give. A page that loads shows what it
// loaded. A page whose request fails stops loading and says that it failed, rather than showing an
// empty page, a page still loading, or data it does not have. Every endpoint a page reads gives the
// same answer, so a page that reads several fails as a whole.

const PAGES = {
  'health checks': {
    route: '/health-checks',
    answers: { 'health-check/:server': byServer('health-checks') },
    loaded: (page) => expect(page.getByText('1 errored')).toBeVisible(),
    data: (page) => page.getByText('1 errored'),
    failed: (page) => page.getByText('15 errored'),
  },
  'search index': {
    route: '/search-index',
    answers: { 'search-index/job-status': fixture('search-index-job-status') },
    loaded: (page) => expect(page.locator('.state-chip')).toHaveText('RUNNING'),
    data: (page) => page.locator('.state-chip'),
  },
  'queue counts': {
    route: '/queue-counts',
    answers: { 'redis/queue-counts': fixture('redis-queue-counts') },
    loaded: (page) => expect(page.locator('.queue-attention').first()).toBeVisible(),
    data: (page) => page.locator('.queue-attention'),
  },
  'resource counts': {
    route: '/resource-counts',
    answers: { 'resources/counts': fixture('resource-counts') },
    loaded: (page) => expect(page.locator('.drift-summary')).toBeVisible(),
    data: (page) => page.locator('.drift-summary'),
  },
  'OpenSearch counts': {
    route: '/resource-counts/opensearch',
    answers: { 'resources/counts/opensearch': fixture('resource-counts-opensearch') },
    loaded: (page) => expect(page.getByRole('cell', { name: '141233' })).toBeVisible(),
    data: (page) => page.getByRole('cell', { name: '141233' }),
  },
  'MySQL counts': {
    route: '/mysql-counts',
    answers: { 'mysql/counts': fixture('mysql-counts') },
    loaded: (page) => expect(page.getByRole('cell', { name: 'log_cypher' })).toBeVisible(),
    data: (page) => page.getByRole('cell', { name: 'log_cypher' }),
    failed: (page) => page.locator('.unreachable').getByText('The report could not be loaded'),
  },
  'log usage': {
    route: '/logs-usage',
    answers: {
      'logs/usage/summary': fixture('logs-usage-summary'),
      'logs/usage/endpoints': fixture('logs-usage-endpoints'),
      'logs/usage/cypher': fixture('logs-usage-cypher'),
      'logs/usage/users': fixture('logs-usage-users'),
      'logs/usage/insights': fixture('logs-usage-insights'),
    },
    loaded: (page) => expect(page.locator('.insights')).toBeVisible(),
    data: (page) => page.locator('.insights'),
  },
  'log explorer': {
    route: '/logs-explorer',
    answers: logsExplorer,
    loaded: (page) => expect(page.locator('tr.main')).toHaveCount(6),
    data: (page) => page.locator('tr.main'),
  },
  environment: {
    route: '/environment',
    answers: {
      'server-report/:server/environment': byServer('environments'),
      'environment-model/declarations': fixture('environment-declarations'),
      'environment-model/unmodelled': fixture('environment-unmodelled'),
    },
    loaded: (page) => expect(page.locator('.unmodelled')).toBeVisible(),
    data: (page) => page.locator('.unmodelled'),
    failed: (page) => page.locator('.banner.warn').getByText('Did not answer'),
  },
  deployments: {
    route: '/deploy',
    answers: { 'server-report/:server/build': byServer('builds'), 'host/git': fixture('host-git') },
    loaded: (page) => expect(page.getByRole('rowheader', { name: 'cedar-development' })).toBeVisible(),
    data: (page) => page.getByRole('rowheader', { name: 'cedar-development' }),
    failed: (page) => page.locator('.tile.warn').getByText('Did not answer'),
  },
  JVM: {
    route: '/jvm',
    answers: { 'server-report/:server/insight': byServer('insights') },
    loaded: (page) => expect(page.locator('.fill.bar-bad')).toBeVisible(),
    data: (page) => page.locator('.fill.bar-bad'),
    failed: (page) => page.locator('.tile.warn').getByText('Did not answer'),
  },
  configuration: {
    route: '/configuration',
    answers: { 'server-report/:server/configuration': fixture('configuration') },
    loaded: (page) => expect(page.locator('app-json-view')).toBeVisible(),
    data: (page) => page.locator('app-json-view'),
  },
  'host disk': {
    route: '/host-disk',
    answers: { 'host/disk': fixture('host-disk') },
    loaded: (page) => expect(page.locator('.fs')).toHaveCount(3),
    data: (page) => page.locator('.fs'),
  },
  'worker lag': {
    route: '/worker-lag',
    answers: { 'worker/lag': fixture('worker-lag') },
    loaded: (page) => expect(page.locator('.verdict')).toBeVisible(),
    data: (page) => page.locator('.verdict'),
  },
  // The page asks for nothing until an identifier is looked up.
  'resource info': {
    route: '/resource-info',
    answers: {
      'command/resource-id-lookup': fixture('resource-id-lookup'),
      'resource/templates': fixture('resource-report-template'),
    },
    act: async (page) => {
      await page.getByRole('textbox', { name: 'Resource id' }).fill(templateId);
      await page.getByRole('button', { name: 'LOOK UP' }).click();
    },
    loaded: (page) => expect(page.locator('app-json-view')).toHaveCount(5),
    data: (page) => page.locator('app-json-view'),
  },
};
const ANSWERS = ['the data', 401, 403, 404, 500, 503, NETWORK_FAILURE];

/** Every endpoint the page reads, answering the same failure. */
const failing = (answers, failure) => Object.fromEntries(Object.keys(answers).map((pattern) => [pattern, failure]));

/**
 * How a page states a failure: an error banner, unless it says so its own way. A page that reads every
 * service names those that did not answer; one that counts them says how many errored.
 */
const failureShown = (page, spec) => (spec.failed ? spec.failed(page) : page.locator('.banner.error'));

for (const [name, spec] of Object.entries(PAGES))
  for (const answer of ANSWERS)
    test(`${name} page answered ${answer}`, async ({ page }) => {
      await openMonitor(page, answer === 'the data' ? spec.answers : failing(spec.answers, answer));
      await page.goto(spec.route);
      if (spec.act) await spec.act(page);
      if (answer === 'the data') {
        await spec.loaded(page);
        await settled(page);
        await expect(page.locator('.banner.error')).toHaveCount(0);
        return;
      }
      await settled(page);
      await expect(failureShown(page, spec).first()).toBeVisible();
      await expect(spec.data(page)).toHaveCount(0);
    });
