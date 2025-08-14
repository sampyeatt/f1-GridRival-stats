import {Component, inject} from '@angular/core'
import {AuthService} from '../../services/auth.service'
import {Router} from '@angular/router'
import {FormsModule, NgForm} from '@angular/forms'
import {Button} from 'primeng/button'

@Component({
  selector: 'app-register',
  imports: [FormsModule, Button],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  email = '';
  password = '';

  private authService = inject(AuthService)
  public router = inject(Router)

  onSubmit(form: NgForm){
    if(form.valid){
      this.authService.register(this.email, this.password)
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
