import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';


@Injectable({
  providedIn: 'root'
})
export class UiService {

  public title: string;
  public description: string;
  public hasTitle: BehaviorSubject<string> = new BehaviorSubject('');
  public hasDescription: BehaviorSubject<string> = new BehaviorSubject('');

  public healthCheckTimeout: number = -1;
  public redisQueueCountTimeout: number = -1;

  constructor(private translateService: TranslateService) {
    this.title = '';
    this.description = '';
  }

  public setTitleAndDescription(title: string, description: string) {
    if (title !== this.title) {
      this.title = title;
      this.hasTitle.next(this.title);
    }
    if (description !== this.description) {
      this.description = description;
      this.hasDescription.next(this.description);
    }
  }

  openUrlInBlank(destination: string) {
    window.open(destination, '_blank');
  }

  openUrl(destination: string) {
    window.location.href = destination;
  }

}

