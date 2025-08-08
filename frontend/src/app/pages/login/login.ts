import {Component, inject} from '@angular/core'
import {Router} from '@angular/router'
import {AuthService} from '../../services/auth.service'
import {FormsModule, NgForm} from '@angular/forms'
import {CommonModule} from '@angular/common'
import {ButtonModule} from 'primeng/button'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, ButtonModule, DividerModule, InputTextModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  username: string = ''
  password: string = ''

  private authService = inject(AuthService)
  public router = inject(Router)

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.username, this.password)
        .subscribe({
          next: (res) => {
            this.authService.saveToken(res.token)
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
