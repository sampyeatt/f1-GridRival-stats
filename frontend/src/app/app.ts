import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavBarComponent} from './component/nav-bar/nav-bar'
import {AdminNavBarComponent} from './component/nav-bar/admin-nav-bar'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, AdminNavBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
