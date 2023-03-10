import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from "../modules/shared/model/app-config.model";

@Injectable()
export class AppConfigService {
  public appConfig: AppConfig | null = null;

  constructor(private http: HttpClient) {
  }

  loadAppConfig() {
    return this.http.get('/assets/data/appConfig.json')
      .toPromise()
      .then(data => {
        this.appConfig = Object.assign(new AppConfig(), data);
      });
  }

  getConfig() {
    return this.appConfig;
  }
}
