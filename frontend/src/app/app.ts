import {Component, inject, signal} from '@angular/core'
import { RouterOutlet } from '@angular/router';
import {NavBarComponent} from './component/nav-bar/nav-bar'
import {AdminNavBarComponent} from './component/admin-nav-bar/admin-nav-bar'
import {AuthService} from './services/auth.service'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, AdminNavBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  private authSercices = inject(AuthService)

  ngOnInit(){
    console.log('App initialized')

    if (this.authSercices.currentUser() === undefined) {
      if (typeof window !== 'undefined')  {
        const currUser = sessionStorage.getItem('user')
        if (currUser) {
          this.authSercices.currentUser.set(JSON.parse(currUser))
        } else {
          this.authSercices.currentUser.set(null)
        }
      }
    }
  }
}
