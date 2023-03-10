import {NgModule} from '@angular/core';
import {SharedModule} from '../shared';
import {ResourcesRoutingModule} from './resources-routing.module';
import {MaterialModule} from '../material-module';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";


@NgModule({
  declarations: [
    HealthChecksComponent
  ],
  imports: [
    SharedModule,
    ResourcesRoutingModule,
    MaterialModule
  ],
  exports: [],
  providers: [],
  entryComponents: []
})
export class ResourcesModule {
}
