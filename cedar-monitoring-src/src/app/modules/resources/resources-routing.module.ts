import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {AuthGuard} from "../../guard/auth.guard";
import {ProfileComponent} from "./pages/profile/profile.component";
import {ResourceInfoComponent} from "./pages/resource-info/resource-info.component";
import {QueueCountsComponent} from "./pages/queue-counts/queue-counts.component";
import {ResourceCountsComponent} from "./pages/resource-counts/resource-counts.component";
import {ResourceCountsOpensearchComponent} from "./pages/resource-counts-opensearch/resource-counts-opensearch.component";
import {LogUsageComponent} from "./pages/log-usage/log-usage.component";
import {LogExplorerComponent} from "./pages/log-explorer/log-explorer.component";

export const routes: Routes = [
  {
    path: 'logs-usage',
    component: LogUsageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'logs-explorer',
    component: LogExplorerComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'health-checks',
    component: HealthChecksComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'resource-info',
    component: ResourceInfoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'queue-counts',
    component: QueueCountsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'resource-counts',
    component: ResourceCountsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'resource-counts/opensearch',
    component: ResourceCountsOpensearchComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {
}
