import {Injectable} from '@angular/core';
import {LocalSettingsService} from './local-settings.service';
import {HealthCheck} from "../shared/model/health-check.model";

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  private healthCheckMap: Map<string, HealthCheck>;

  constructor(
    private localSettings: LocalSettingsService
  ) {
    this.healthCheckMap = new Map<string, HealthCheck>();
  }

  setHealthCheck(server: string, healthCheck: HealthCheck) {
    this.healthCheckMap.set(server, healthCheck);
  }

  getHealthCheck(server: string): HealthCheck | undefined {
    return this.healthCheckMap.get(server);
  }

}
