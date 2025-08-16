import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LoginComponent} from './pages/login/login'
import {RegisterComponent} from './pages/register/register'
import {DashboardComponent} from './pages/dashboard/dashboard'
import {AdminComponent} from './pages/admin/admin.component'
import {BrowserModule} from '@angular/platform-browser'

@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    AdminComponent,
    BrowserModule,
  ]
})
export class AppModule { }
