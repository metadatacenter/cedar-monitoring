import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {EverytimeService} from "../../services/can-activate/everytime.service";
import {HealthChecksComponent} from "./pages/health-checks/health-checks.component";

export const routes: Routes = [
  {
    path: 'health-checks',
    component: HealthChecksComponent,
    canActivate: [EverytimeService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResourcesRoutingModule {
}
