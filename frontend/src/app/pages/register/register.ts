import {Component, inject} from '@angular/core'
import {AuthService} from '../../services/auth.service'
import {Router} from '@angular/router'
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {Button} from 'primeng/button'
import {CommonModule} from '@angular/common'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, Button, ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  private authService = inject(AuthService)
  public router = inject(Router)
  fb = inject(FormBuilder)

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')]],
  })

  onSubmit(){
    if(this.form.valid){
      this.authService.register(this.form.value.email as string, this.form.value.password as string)
        .subscribe({
          next:()=>{
            alert('Registration successful! Please check your email and log in.');
            this.router.navigate(['/login'])
          },
          error: (err)=>{
            console.error('Registration failed.', err);
            alert('Registration failed: '+(err.error?.message || "Unknown error"))
          }
        });
    }
  }
}
