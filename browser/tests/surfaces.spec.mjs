import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { surfaceCases, checkSurface } from './surface-contracts.generated.mjs';

const registry = JSON.parse(readFileSync(new URL('../../.ui-surfaces.json', import.meta.url), 'utf8'));
const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
const config = fixture('app-config');
const realm = `${config.keycloakUrl}realms/CEDAR`;
const templateId = 'https://repo.metadatacenter.org/templates/a8f75474-ca14-4726-a071-acbfa9f8c466';

// An unsigned token. keycloak-js decodes the claims and never checks a signature.
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (claims) => `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.`;
const session = 'b4e7c2a9-5d1f-4e8b-9a3c-6f0d2e7b1c58';
const account = fixture('account');
const identity = {
  sub: account.id,
  azp: 'cedar-frontend-monitoring',
  session_state: session,
  sid: session,
  scope: 'openid email profile',
  email_verified: account.emailVerified,
  preferred_username: account.username,
  given_name: account.firstName,
  family_name: account.lastName,
  email: account.email,
  realm_access: { roles: ['offline_access', 'uma_authorization'] },
};

// The application loads its configuration and then runs keycloak-js with check-sso before it
// routes. Both are answered as the deployment answers them for a signed-in user. The third-party
// cookie probe reports support, and the session iframe reports a changed session until a token
// carries one. The silent check-sso iframe then returns to the application with a code. The code
// carries the nonce of the authorization request, so the token endpoint can put that nonce in every
// token, as keycloak-js requires.
async function signIn(page) {
  // The stubbed Keycloak is a public host and the application runs on loopback. Without the local
  // network access permission, Chromium refuses the silent check-sso iframe's return to loopback.
  await page.context().grantPermissions(['local-network-access']);
  await page.route('**/assets/data/appConfig.json', (route) => route.fulfill({ json: config }));
  await page.route(`${realm}/**`, (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(new URL(realm).pathname.length);
    const script = (body) => route.fulfill({ contentType: 'text/html', body: `<!doctype html><script>${body}</script>` });
    switch (path) {
      case '/protocol/openid-connect/3p-cookies/step1.html':
        return script('parent.postMessage("supported", "*")');
      case '/protocol/openid-connect/login-status-iframe.html':
        return script(`addEventListener('message', (event) =>
          event.source.postMessage(String(event.data).split(' ')[1] ? 'unchanged' : 'changed', event.origin))`);
      case '/protocol/openid-connect/auth': {
        const query = url.searchParams;
        const code = Buffer.from(query.get('nonce')).toString('base64url');
        const callback = `${query.get('redirect_uri')}#state=${query.get('state')}&session_state=${session}&code=${code}`;
        return script(`location.replace(${JSON.stringify(callback)})`);
      }
      case '/protocol/openid-connect/token': {
        const nonce = Buffer.from(new URLSearchParams(request.postData()).get('code'), 'base64url').toString();
        const now = Math.floor(Date.now() / 1000);
        const claims = { ...identity, iat: now, exp: now + 3600, auth_time: now, iss: realm, nonce };
        return route.fulfill({
          json: {
            access_token: jwt({ ...claims, typ: 'Bearer' }),
            refresh_token: jwt({ ...claims, typ: 'Refresh' }),
            id_token: jwt({ ...claims, typ: 'ID' }),
            token_type: 'Bearer',
            expires_in: 3600,
            session_state: session,
          },
        });
      }
      case '/account':
        return route.fulfill({ json: account });
      default:
        return route.fulfill({ status: 404, json: {} });
    }
  });
}

// The suite never leaves the machine. Keycloak and the monitor API are answered from fixtures, and
// every other external request is refused. A fixture keyed by server answers the per-server routes.
// A server the fixture leaves out answers 503, as a service that is down would.
async function openMonitor(page, answers) {
  await page.route((url) => url.host !== new URL(test.info().project.use.baseURL).host, (route) => route.abort());
  await signIn(page);
  const routes = Object.entries(answers).map(([pattern, answer]) => [
    new RegExp(`^/${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
    answer,
  ]);
  await page.route(`${config.apiUrl}**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    const [match, answer] = routes.map(([pattern, value]) => [path.match(pattern), value]).find(([found]) => found) ?? [null, 404];
    const value = typeof answer === 'function' ? answer(match.groups ?? {}) : answer;
    return route.fulfill(typeof value === 'number' ? { status: value, json: {} } : { json: value });
  });
}
const byServer = (name) => ({ server }) => fixture(name)[server] ?? 503;

// The pages show "Loading…" and a spinner until every request has answered.
async function settled(page) {
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await expect(page.locator('.banner.loading')).toHaveCount(0);
}

const logsExplorer = {
  'logs/coverage': fixture('logs-coverage'),
  'logs/boards': fixture('logs-boards'),
  'logs/query': fixture('logs-query'),
  'logs/facets/:column': ({ column }) => fixture('logs-facets')[column] ?? 404,
  'logs/trace/:id': fixture('logs-trace'),
};

const scenarios = {
  dashboard: async (page) => {
    await openMonitor(page, {});
    await page.goto('/');
    await expect(page.locator('.dash-card').first()).toBeVisible();
  },
  'user-menu': async (page) => {
    await scenarios.dashboard(page);
    await page.getByRole('button', { name: 'User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
  },
  'health-checks': async (page) => {
    await openMonitor(page, { 'health-check/:server': byServer('health-checks') });
    await page.goto('/health-checks');
    await expect(page.getByText('1 errored')).toBeVisible();
    await settled(page);
  },
  profile: async (page) => {
    await openMonitor(page, {});
    await page.goto('/profile');
    await expect(page.locator('.profile-card')).toBeVisible();
  },
  // The page makes no request until an identifier is looked up.
  'resource-info': async (page) => {
    await openMonitor(page, {
      'command/resource-id-lookup': fixture('resource-id-lookup'),
      'resource/templates': fixture('resource-report-template'),
    });
    await page.goto('/resource-info');
    await page.getByRole('textbox', { name: 'Resource id' }).fill(templateId);
    await page.getByRole('button', { name: 'LOOK UP' }).click();
    await expect(page.locator('app-json-view')).toHaveCount(5);
    await settled(page);
  },
  'search-index': async (page) => {
    await openMonitor(page, { 'search-index/job-status': fixture('search-index-job-status') });
    await page.goto('/search-index');
    await expect(page.locator('.state-chip')).toHaveText('RUNNING');
    await settled(page);
  },
  'queue-counts': async (page) => {
    await openMonitor(page, { 'redis/queue-counts': fixture('redis-queue-counts') });
    await page.goto('/queue-counts');
    await expect(page.locator('.queue-attention').first()).toBeVisible();
    await settled(page);
  },
  'resource-counts': async (page) => {
    await openMonitor(page, { 'resources/counts': fixture('resource-counts') });
    await page.goto('/resource-counts');
    await expect(page.locator('.drift-summary')).toBeVisible();
    await settled(page);
  },
  'opensearch-counts': async (page) => {
    await openMonitor(page, { 'resources/counts/opensearch': fixture('resource-counts-opensearch') });
    await page.goto('/resource-counts/opensearch');
    await expect(page.getByRole('cell', { name: '141233' })).toBeVisible();
    await settled(page);
  },
  'mysql-counts': async (page) => {
    await openMonitor(page, { 'mysql/counts': fixture('mysql-counts') });
    await page.goto('/mysql-counts');
    await expect(page.getByRole('cell', { name: 'log_cypher' })).toBeVisible();
    await settled(page);
  },
  'logs-usage': async (page) => {
    await openMonitor(page, {
      'logs/usage/summary': fixture('logs-usage-summary'),
      'logs/usage/endpoints': fixture('logs-usage-endpoints'),
      'logs/usage/cypher': fixture('logs-usage-cypher'),
      'logs/usage/users': fixture('logs-usage-users'),
      'logs/usage/insights': fixture('logs-usage-insights'),
    });
    await page.goto('/logs-usage');
    await expect(page.locator('.insights')).toBeVisible();
    await settled(page);
  },
  'logs-explorer': async (page) => {
    await openMonitor(page, logsExplorer);
    await page.goto('/logs-explorer');
    await expect(page.locator('tr.main')).toHaveCount(6);
    await expect(page.locator('.caveat')).toBeVisible();
    await settled(page);
  },
  // A row opens from its caret, since a click on any other cell copies that cell's value, and the
  // row's trace opens from the detail beneath it.
  'request-trace': async (page) => {
    await scenarios['logs-explorer'](page);
    await page.locator('tr.main').nth(1).locator('td').first().click();
    await page.getByRole('button', { name: 'open trace →' }).click();
    await expect(page.locator('.tracepane .wrow')).toHaveCount(5);
  },
  // A click on a cell copies its value, and a toast confirms the copy for a second and a half. The
  // clock is paused once the page has settled, so the toast stays up for the walk.
  'copy-confirmation': async (page) => {
    await page.context().grantPermissions(['clipboard-write']);
    await page.clock.install();
    await scenarios['logs-explorer'](page);
    await page.clock.pauseAt(Date.now() + 1000);
    await page.locator('tr.main').first().getByRole('cell', { name: 'resource', exact: true }).click();
    await expect(page.locator('.toast')).toHaveText('Copied component');
  },
  environment: async (page) => {
    await openMonitor(page, {
      'server-report/:server/environment': byServer('environments'),
      'environment-model/declarations': fixture('environment-declarations'),
      'environment-model/unmodelled': fixture('environment-unmodelled'),
    });
    await page.goto('/environment');
    await expect(page.locator('.unmodelled')).toBeVisible();
    await settled(page);
  },
  deploy: async (page) => {
    await openMonitor(page, {
      'server-report/:server/build': byServer('builds'),
      'host/git': fixture('host-git'),
    });
    await page.goto('/deploy');
    await expect(page.getByRole('rowheader', { name: 'cedar-development' })).toBeVisible();
    await settled(page);
  },
  jvm: async (page) => {
    await openMonitor(page, { 'server-report/:server/insight': byServer('insights') });
    await page.goto('/jvm');
    await expect(page.locator('.fill.bar-bad')).toBeVisible();
    await settled(page);
  },
  configuration: async (page) => {
    await openMonitor(page, { 'server-report/:server/configuration': fixture('configuration') });
    await page.goto('/configuration');
    await expect(page.locator('app-json-view')).toBeVisible();
    await settled(page);
  },
  'host-disk': async (page) => {
    await openMonitor(page, { 'host/disk': fixture('host-disk') });
    await page.goto('/host-disk');
    await expect(page.locator('.fs')).toHaveCount(3);
    await settled(page);
  },
  'worker-lag': async (page) => {
    await openMonitor(page, { 'worker/lag': fixture('worker-lag') });
    await page.goto('/worker-lag');
    await expect(page.locator('.verdict')).toBeVisible();
    await settled(page);
  },
};

for (const { surface, state, width, title } of surfaceCases(registry, scenarios))
  test(title, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await scenarios[surface.scenario](page);
    await expect(page.locator('app-header mat-toolbar')).toBeVisible();
    await checkSurface(page, surface, state, expect, testInfo);
  });
