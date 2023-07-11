import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from "../modules/shared/model/app-config.model";
import {tap} from "rxjs/operators";
import {globalAppConfig} from "../../environments/global-app-config";

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  constructor(private http: HttpClient) {
  }

  loadAppConfig() {
    return this.http.get('/assets/data/appConfig.json')
      .pipe(
        tap(data => {
            globalAppConfig.init(Object.assign(new AppConfig(), data))
          }
        ));
  }

}
