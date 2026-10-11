import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  isTakingLonger = signal(false);
  erreur = signal<string | null>(null);

  constructor(private fb: FormBuilder,
              private authService: AuthService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.erreur.set(null);

    // Si au bout de 3 secondes on n'a toujours rien, c'est que le serveur se réveille
    const timer = setTimeout(() => {
      if (this.isLoading()) this.isTakingLonger.set(true);
    }, 3000);

    this.authService.login(this.loginForm.value).subscribe({
      error: (err: HttpErrorResponse) => {
        clearTimeout(timer);
        this.isLoading.set(false);
        this.isTakingLonger.set(false);
        this.erreur.set(err.status === 401
          ? 'Identifiant ou mot de passe incorrect.'
          : 'Le serveur ne répond pas, réessayez dans un instant.');
      }
    });
  }
}
