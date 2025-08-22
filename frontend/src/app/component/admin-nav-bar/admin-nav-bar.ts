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
  templateUrl: './admin-nav-bar.html',
  styleUrl: './admin-nav-bar.css',
})
export class AdminNavBarComponent {

  public authService = inject(AuthService)
  public router = inject(Router)

  get authenticated(){
    return this.authService.isAdminAuthenticated();
  }
}
