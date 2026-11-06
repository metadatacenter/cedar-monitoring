import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from "./modules/shared/pages/dashboard/dashboard.component";
import {AuthGuard} from "./guard/auth.guard";
import {NoAccessComponent} from "./modules/shared/pages/no-access/no-access.component";

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full',
    canActivate: [AuthGuard]
  },
  {
    path: 'no-access',
    component: NoAccessComponent,
    canActivate: [AuthGuard],
    data: {monitorAccess: false}
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
