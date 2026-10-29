import {CedarIconDirective} from './directives/cedar-icon.directive';
import {NounPipe} from './pipes/noun.pipe';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {SpinnerComponent} from './components/spinner/spinner.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {MaterialModule} from '../../modules/material-module';
import {HeaderComponent} from "./components/header/header.component";
import {JsonViewComponent} from "./components/json-view/json-view.component";
import {ClipboardModule} from "@angular/cdk/clipboard";

@NgModule({
  imports: [
    CedarIconDirective,
    NounPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslatePipe,
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
    CedarIconDirective,
    NounPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslatePipe,
    SpinnerComponent,
    HeaderComponent,
    JsonViewComponent
  ]
})
export class SharedModule {
}
