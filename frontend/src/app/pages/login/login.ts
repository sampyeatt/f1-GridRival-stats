import {ChangeDetectorRef, Component, inject} from '@angular/core'
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
  errorMessage?: string

  private authService = inject(AuthService)
  public router = inject(Router)
  private cdref = inject(ChangeDetectorRef)

  onSubmit(form: NgForm) {
    this.errorMessage = undefined
    if (form.valid) {
      this.authService.login(this.email, this.password)
        .subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err) => {
            console.error('Login failed: ', err)
            // `'text ' + x || 'fallback'` binds the || after the concatenation,
            // so the fallback was dead and err.error.error threw outright on a
            // network error, where err.error is undefined.
            this.errorMessage = err?.error?.message ?? 'Check your email and password.'
            this.cdref.markForCheck()
          }
        })
    }
  }
}
