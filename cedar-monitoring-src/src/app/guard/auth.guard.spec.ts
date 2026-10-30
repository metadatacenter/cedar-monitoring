import {describe, expect, it} from 'vitest';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {KeycloakService} from 'keycloak-angular';
import {AuthGuard} from './auth.guard';
import {MonitorAccess, MonitorAccessService} from '../services/monitor-access.service';

function guardFor(access: MonitorAccess) {
  const checks: number[] = [];
  const noAccess = {} as UrlTree;
  const router = {parseUrl: (url: string) => url === '/no-access' ? noAccess : null} as unknown as Router;
  const monitorAccess = {check: async () => { checks.push(1); return access; }} as unknown as MonitorAccessService;
  const guard = new AuthGuard(router, {} as KeycloakService, monitorAccess);
  // Set by KeycloakAuthGuard.canActivate before it calls isAccessAllowed.
  Object.assign(guard, {authenticated: true, roles: []});
  const allowed = (data: object) =>
    guard.isAccessAllowed({data} as unknown as ActivatedRouteSnapshot, {url: '/'} as RouterStateSnapshot);
  return {allowed, checks, noAccess};
}

describe('AuthGuard', () => {
  it('lets a user with MONITOR_READ through', async () => {
    expect(await guardFor('allowed').allowed({})).toBe(true);
  });

  it('sends a signed-in user without MONITOR_READ to /no-access', async () => {
    const g = guardFor('denied');
    expect(await g.allowed({})).toBe(g.noAccess);
  });

  it('does not ask the monitor for routes that opt out', async () => {
    const g = guardFor('denied');
    expect(await g.allowed({monitorAccess: false})).toBe(true);
    expect(g.checks.length).toBe(0);
  });
});
