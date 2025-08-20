import {Component, inject} from '@angular/core'
import {Router} from '@angular/router'
import {AuthService} from '../../services/auth.service'
import {FormsModule, NgForm, ReactiveFormsModule} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ButtonModule, DividerModule, InputTextModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  email: string = ''
  password: string = ''

  private authService = inject(AuthService)
  public router = inject(Router)

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.email, this.password)
        .subscribe({
          next: (res) => {
            console.log('Login successful: ', res)
            this.authService.saveToken(res.accessToken)
            this.authService.saveUser(res.user.userId)
            if (res.adminToken !== null) this.authService.saveAdminToken(res.adminToken)
            this.authService.currentUser.set(res)
            this.router.navigate(['/dashboard'])
          },
          error: (err) => {
            console.error('Login failed: ', err)
            alert('Login failed ' + (err.error.error) || 'Check credentials')
          }
        })
    }
  }
}
