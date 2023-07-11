export class AppConfig {
  appUrl: string = '';
  apiUrl: string = '';
  cedarUrl: string = '';
  keycloakUrl: string = '';
  loaded: boolean = false;

  init(appConfig: AppConfig) {
    const domain = (window as any).cedarDomain;
    this.keycloakUrl = appConfig.keycloakUrl.replace('{{cedarDomain}}', domain);
    this.appUrl = appConfig.appUrl.replace('{{cedarDomain}}', domain);
    this.apiUrl = appConfig.apiUrl.replace('{{cedarDomain}}', domain);
    this.cedarUrl = appConfig.cedarUrl.replace('{{cedarDomain}}', domain);
    this.loaded = true;
  }
}
