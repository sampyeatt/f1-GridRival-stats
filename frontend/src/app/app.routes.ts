import {RouterModule, Routes} from '@angular/router'
import {DashboardComponent} from './pages/dashboard/dashboard'
import {LoginComponent} from './pages/login/login'
import {RegisterComponent} from './pages/register/register'
import {authGuard, authGuardAdmin} from './guard/auth.guard'
import {NgModule} from '@angular/core'
import {ResultAdminComponent} from './pages/admin/result-admin/result-admin.component'
import {SeasonAdminComponent} from './pages/admin/season-admin/season-admin.component'
import {RaceAdminComponent} from './pages/admin/race-admin/race-admin.component'
import {TeamAdminComponent} from './pages/admin/team-admin/team-admin.component'
import {DriverAdminComponent} from './pages/admin/driver-admin/driver-admin.component'

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'admin/result-admin', component: ResultAdminComponent, canActivate: [authGuardAdmin]},
  {path: 'admin/season-admin', component: SeasonAdminComponent, canActivate: [authGuardAdmin]},
  {path: 'admin/race-admin', component: RaceAdminComponent, canActivate: [authGuardAdmin]},
  {path: 'admin/driver-admin', component: DriverAdminComponent, canActivate: [authGuardAdmin]},
  {path: 'admin/team-admin', component: TeamAdminComponent, canActivate: [authGuardAdmin]},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: '', redirectTo: 'login', pathMatch: 'full'}
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppModule {}
