import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {

  public active: boolean = false;
  private loadCount: number = 0;

  show() {
    this.active = true;
    this.loadCount++;
    //console.log("Spinner.show" + this.loadCount);
  }

  hide() {
    this.loadCount--;
    //console.log("Spinner.hide" + this.loadCount);
    if (this.loadCount <= 0) {
      this.loadCount = 0;
      this.active = false;
    }
  }

  reset() {
    this.loadCount = 0;
  }

  resetAndShow() {
    this.reset();
    this.show();
  }
}
