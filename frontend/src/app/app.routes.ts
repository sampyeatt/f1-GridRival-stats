import {RouterModule, Routes} from '@angular/router'
import {DashboardComponent} from './pages/dashboard/dashboard'
import {LoginComponent} from './pages/login/login'
import {RegisterComponent} from './pages/register/register'
import {authGuard, authGuardAdmin} from './guard/auth.guard'
import {NgModule} from '@angular/core'
import {AdminComponent} from './pages/admin/admin.component'

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'admin', component: AdminComponent, canActivate: [authGuardAdmin]},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: '', redirectTo: 'login', pathMatch: 'full'}
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppModule {}
