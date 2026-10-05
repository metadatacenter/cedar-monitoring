import {environment} from '../../../../environments/environment';
import {useDeploymentDomain} from '../../../resource-address';

export class AppConfig {
  appUrl: string = '';
  apiUrl: string = '';
  cedarUrl: string = '';
  keycloakUrl: string = '';
  loaded: boolean = false;

  init(appConfig: AppConfig) {
    const domain = environment.cedarDomain;
    // Identities are minted on repo.<domain>, and only those are addressed in the compact form.
    useDeploymentDomain(domain);
    this.keycloakUrl = appConfig.keycloakUrl.replace('{{cedarDomain}}', domain);
    this.appUrl = appConfig.appUrl.replace('{{cedarDomain}}', domain);
    this.apiUrl = appConfig.apiUrl.replace('{{cedarDomain}}', domain);
    this.cedarUrl = appConfig.cedarUrl.replace('{{cedarDomain}}', domain);
    this.loaded = true;
  }
}
