import {KeycloakService} from "keycloak-angular";
import {globalAppConfig} from "../../environments/global-app-config";

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForGlobalConfig() {
  while (true) {
    if (!globalAppConfig.loaded) {
      await delay(100);
    } else {
      break;
    }
  }
}

export function initializeKeycloak(
  keycloak: KeycloakService
) {
  return async () => {
    await waitForGlobalConfig();
    return keycloak.init({
      config: {
        url: globalAppConfig.keycloakUrl,
        realm: 'CEDAR',
        clientId: 'cedar-frontend-monitoring',
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
      }
    });
  }
}
