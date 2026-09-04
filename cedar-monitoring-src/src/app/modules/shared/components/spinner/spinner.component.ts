import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {SpinnerService} from '../../../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SpinnerComponent implements OnInit {

  constructor(public spinnerService: SpinnerService) {
  }

  ngOnInit() {
  }

}
