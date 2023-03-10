import {Injectable} from '@angular/core';
import {AppConfigService} from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class RestApiUrlService {

  private configService: AppConfigService;

  private API_URL: string;

  constructor(configService: AppConfigService) {
    this.configService = configService;
    this.API_URL = this.configService.appConfig?.apiUrl ?? '';
  }

  private base() {
    return `${this.API_URL}`;
  }

  private healthChecks() {
    return `${this.base()}health-check`;
  }

  public healthCheck(server: string) {
    return `${this.healthChecks()}/${encodeURIComponent(server)}`;
  }

}
