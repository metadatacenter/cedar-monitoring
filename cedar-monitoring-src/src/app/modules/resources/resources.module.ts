import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../shared';
import {ResourcesRoutingModule} from './resources-routing.module';
import {MaterialModule} from '../material-module';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {ProfileComponent} from "./pages/profile/profile.component";
import {ResourceInfoComponent} from "./pages/resource-info/resource-info.component";
import {QueueCountsComponent} from "./pages/queue-counts/queue-counts.component";
import {ResourceCountsComponent} from "./pages/resource-counts/resource-counts.component";
import {ResourceCountsOpensearchComponent} from "./pages/resource-counts-opensearch/resource-counts-opensearch.component";
import {MySqlCountsComponent} from "./pages/mysql-counts/mysql-counts.component";
import {LogUsageComponent} from "./pages/log-usage/log-usage.component";
import {LogExplorerComponent} from "./pages/log-explorer/log-explorer.component";


@NgModule({
  declarations: [
    HealthChecksComponent,
    ProfileComponent,
    ResourceInfoComponent,
    QueueCountsComponent,
    ResourceCountsComponent,
    ResourceCountsOpensearchComponent,
    MySqlCountsComponent,
    LogUsageComponent,
    LogExplorerComponent
  ],
  imports: [
    SharedModule,
    ResourcesRoutingModule,
    MaterialModule,
    FormsModule
  ],
  exports: [],
  providers: [],
  entryComponents: []
})
export class ResourcesModule {
}
