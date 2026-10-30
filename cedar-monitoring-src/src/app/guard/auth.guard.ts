import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {KeycloakAuthGuard, KeycloakService} from 'keycloak-angular';
import {MonitorAccessService} from '../services/monitor-access.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {

  constructor(
    protected override readonly router: Router,
    protected readonly keycloak: KeycloakService,
    private readonly monitorAccess: MonitorAccessService
  ) {
    super(router, keycloak);
  }

  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    // Force the user to log in if currently unauthenticated.
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url
      });
    }

    // Signed in is not enough: the Monitor's data needs MONITOR_READ. Routes that only show Keycloak
    // data, and the page that explains the refusal, opt out with monitorAccess: false. Unauthenticated,
    // the login redirect above is already leaving the page; asking now would only send a request
    // without a token.
    if (this.authenticated && route.data['monitorAccess'] !== false
      && await this.monitorAccess.check() === 'denied') {
      return this.router.parseUrl('/no-access');
    }

    // Get the roles required from the route.
    const requiredRoles = route.data['roles'];

    // Allow the user to proceed if no additional roles are required to access the route.
    if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
      return true;
    }

    // Allow the user to proceed if all the required roles are present.
    return requiredRoles.every((role) => this.roles.includes(role));
  }
}
