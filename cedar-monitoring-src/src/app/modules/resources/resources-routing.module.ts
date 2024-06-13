import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {AuthGuard} from "../../guard/auth.guard";
import {ProfileComponent} from "./pages/profile/profile.component";
import {ResourceInfoComponent} from "./pages/resource-info/resource-info.component";
import {QueueCountsComponent} from "./pages/queue-counts/queue-counts.component";
import {ResourceCountsComponent} from "./pages/resource-counts/resource-counts.component";
import {ResourceCountsOpensearchComponent} from "./pages/resource-counts-opensearch/resource-counts-opensearch.component";

export const routes: Routes = [
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
