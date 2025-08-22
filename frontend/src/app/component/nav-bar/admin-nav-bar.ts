import { CommonModule } from '@angular/common';
import {Component, inject} from '@angular/core'
import { AuthService } from '../../services/auth.service';
import {Router, RouterModule} from '@angular/router'

@Component({
  selector: 'app-admin-nav-bar',
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    @if (authenticated) {
      <nav class="bg-red-900 text-white p-4 flex items-center">
        <div>
          <a *ngIf="authenticated" class="mr-4" routerLink="/admin/season-admin">Seasons</a>
          <a *ngIf="authenticated" class="mr-4" routerLink="/admin/race-admin">Races</a>
          <a *ngIf="authenticated" class="mr-4" routerLink="/admin/team-admin">Teams</a>
          <a *ngIf="authenticated" class="mr-4" routerLink="/admin/driver-admin">Drivers</a>
          <a *ngIf="authenticated" class="mr-4" routerLink="/admin/result-admin">Results</a>
        </div>
      </nav>
    }
  `,
  styles: ``
})
export class AdminNavBarComponent {

  public authService = inject(AuthService)
  public router = inject(Router)

  get authenticated(){
    return this.authService.isAdminAuthenticated();
  }
}
