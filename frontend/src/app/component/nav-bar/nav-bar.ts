import { CommonModule } from '@angular/common';
import {Component, inject} from '@angular/core'
import { AuthService } from '../../services/auth.service';
import {Router, RouterModule} from '@angular/router'
import {ButtonModule} from 'primeng/button'

@Component({
  selector: 'app-nav-bar',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBarComponent {

  public authService = inject(AuthService)
  public router = inject(Router)

  get authenticated(){
    return this.authService.isAuthenticated();
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
