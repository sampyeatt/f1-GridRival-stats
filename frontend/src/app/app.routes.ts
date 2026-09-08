import {Routes} from '@angular/router'
import {authGuard, authGuardAdmin} from './guard/auth.guard'

/**
 * Every route is lazy.
 *
 * They were all eagerly imported, so the five admin screens and their PrimeNG
 * table, chart and tab dependencies shipped in the initial bundle to a user who
 * only ever opens the dashboard.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'admin/result-admin',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/result-admin/result-admin.component').then(m => m.ResultAdminComponent)
  },
  {
    path: 'admin/season-admin',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/season-admin/season-admin.component').then(m => m.SeasonAdminComponent)
  },
  {
    path: 'admin/race-admin',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/race-admin/race-admin.component').then(m => m.RaceAdminComponent)
  },
  {
    path: 'admin/driver-admin',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/driver-admin/driver-admin.component').then(m => m.DriverAdminComponent)
  },
  {
    path: 'admin/team-admin',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/team-admin/team-admin.component').then(m => m.TeamAdminComponent)
  },
  {
    path: 'admin/scheduler',
    canActivate: [authGuardAdmin],
    loadComponent: () => import('./pages/admin/scheduler-admin/scheduler-admin.component').then(m => m.SchedulerAdminComponent)
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'}
]
