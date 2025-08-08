import {Component, inject} from '@angular/core'
import {AuthService} from '../../services/auth.service'
import {Router} from '@angular/router'
import {FormsModule, NgForm} from '@angular/forms'

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  username = '';
  password = '';

  private authService = inject(AuthService)
  public router = inject(Router)

  onSubmit(form: NgForm){
    if(form.valid){
      this.authService.register(this.username, this.password)
        .subscribe({
          next:()=>{
            alert('Registration successful! Please log in.');
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
