import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {SpinnerComponent} from './components/spinner/spinner.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {MaterialModule} from '../../modules/material-module';
import {HeaderComponent} from "./components/header/header.component";
import {JsonViewComponent} from "./components/json-view/json-view.component";
import {ClipboardModule} from "@angular/cdk/clipboard";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MaterialModule,
    ClipboardModule,
  ],
  declarations: [
    SpinnerComponent,
    DashboardComponent,
    HeaderComponent,
    JsonViewComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    SpinnerComponent,
    HeaderComponent,
    JsonViewComponent
  ]
})
export class SharedModule {
}
