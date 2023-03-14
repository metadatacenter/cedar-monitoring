import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";
import {AuthGuard} from "../../guard/auth.guard";
import {ProfileComponent} from "./pages/profile/profile.component";

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {
}
