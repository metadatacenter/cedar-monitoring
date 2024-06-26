import {NgModule} from '@angular/core';
import {SharedModule} from '../shared';
import {ResourcesRoutingModule} from './resources-routing.module';
import {MaterialModule} from '../material-module';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {ProfileComponent} from "./pages/profile/profile.component";
import {ResourceInfoComponent} from "./pages/resource-info/resource-info.component";
import {QueueCountsComponent} from "./pages/queue-counts/queue-counts.component";
import {ResourceCountsComponent} from "./pages/resource-counts/resource-counts.component";
import {ResourceCountsOpensearchComponent} from "./pages/resource-counts-opensearch/resource-counts-opensearch.component";


@NgModule({
  declarations: [
    HealthChecksComponent,
    ProfileComponent,
    ResourceInfoComponent,
    QueueCountsComponent,
    ResourceCountsComponent,
    ResourceCountsOpensearchComponent
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
