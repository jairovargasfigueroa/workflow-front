import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    direccion: [''],
    cedula: ['']
  });

  loading = signal(false);
  error = signal<string | null>(null);
  hidePassword = signal(true);

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { nombre, email, password, telefono, direccion, cedula } = this.form.value;
    this.authService
      .register({
        nombre: nombre!,
        email: email!,
        password: password!,
        ...(telefono && { telefono }),
        ...(direccion && { direccion }),
        ...(cedula && { cedula })
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: err => {
          this.error.set(err.error?.message || 'Error al registrarse. Intente nuevamente.');
          this.loading.set(false);
        }
      });
  }
}
