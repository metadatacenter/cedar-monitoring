import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RestApiUrlService} from '../rest-api-url.service';
import {WorkerLag} from '../../shared/model/worker-lag.model';

/** Reads the log pipeline's queue depth and write lag from cedar-monitor-server /worker/lag. */
@Injectable({
  providedIn: 'root'
})
export class WorkerLagService {

  constructor(private http: HttpClient, private restApiUrl: RestApiUrlService) {
  }

  lag(): Observable<WorkerLag> {
    return this.http.get<WorkerLag>(this.restApiUrl.workerLag());
  }
}
