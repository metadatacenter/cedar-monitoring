import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {AuthGuard} from "../../guard/auth.guard";
import {ProfileComponent} from "./pages/profile/profile.component";
import {ResourceInfoComponent} from "./pages/resource-info/resource-info.component";
import {QueueCountsComponent} from "./pages/queue-counts/queue-counts.component";

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {
}
