// The Monitoring application with Keycloak and the monitor API answered in the browser. The real
// application is served; sign-in and every API request are answered from fixtures.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

/** An answer that is no answer at all: the request fails as a dropped connection does. */
export const NETWORK_FAILURE = 'a network failure';

export const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
const config = fixture('app-config');
const realm = `${config.keycloakUrl}realms/CEDAR`;
export const templateId = 'https://repo.metadatacenter.org/templates/a8f75474-ca14-4726-a071-acbfa9f8c466';

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
export async function openMonitor(page, answers) {
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
    if (value === NETWORK_FAILURE) return route.abort('failed');
    return route.fulfill(typeof value === 'number' ? { status: value, json: {} } : { json: value });
  });
}
export const byServer = (name) => ({ server }) => fixture(name)[server] ?? 503;

// The pages show "Loading…" and a spinner until every request has answered.
export async function settled(page) {
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await expect(page.locator('.banner.loading')).toHaveCount(0);
}

export const logsExplorer = {
  'logs/coverage': fixture('logs-coverage'),
  'logs/boards': fixture('logs-boards'),
  'logs/query': fixture('logs-query'),
  'logs/facets/:column': ({ column }) => fixture('logs-facets')[column] ?? 404,
  'logs/trace/:id': fixture('logs-trace'),
};
