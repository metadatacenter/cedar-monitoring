import {Component, ChangeDetectionStrategy} from '@angular/core';
import {SpinnerService} from '../../../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SpinnerComponent {

  constructor(public spinnerService: SpinnerService) {
  }

}
