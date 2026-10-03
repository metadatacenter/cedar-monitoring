import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class UiService {

  public healthCheckTimeout: number = -1;
  public redisQueueCountTimeout: number = -1;

  openUrlInBlank(destination: string) {
    window.open(destination, '_blank');
  }

}
