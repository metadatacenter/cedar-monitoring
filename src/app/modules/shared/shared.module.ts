import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {SpinnerComponent} from './components/spinner/spinner.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {MaterialModule} from '../../modules/material-module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MaterialModule,
  ],
  declarations: [
    SpinnerComponent,
    DashboardComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    SpinnerComponent,
  ]
})
export class SharedModule {
}
