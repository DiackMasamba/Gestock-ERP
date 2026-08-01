import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth">
      <form class="card" (ngSubmit)="submit()">
        <div class="brand">
          <span class="logo">📷</span>
          <h1>Paiejour</h1>
          <p>Pointage des journaliers par scan</p>
        </div>

        <label>
          Email
          <input type="email" name="email" [(ngModel)]="email" required autocomplete="username" />
        </label>

        <label>
          Mot de passe
          <input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading()">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>

        <p class="hint">Démo : admin&#64;paiejour.test / password</p>
      </form>
    </div>
  `,
  styles: [
    `
      .auth {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background: linear-gradient(160deg, #0f766e, #0d3b66);
        padding: 1.5rem;
      }
      .card {
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 20px;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      }
      .brand {
        text-align: center;
        margin-bottom: 0.5rem;
      }
      .logo {
        font-size: 2.5rem;
      }
      .brand h1 {
        margin: 0.25rem 0 0;
        font-size: 1.6rem;
        color: #0f172a;
      }
      .brand p {
        margin: 0.25rem 0 0;
        color: #64748b;
        font-size: 0.85rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
        color: #334155;
        font-weight: 600;
      }
      input {
        padding: 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        font-size: 1rem;
      }
      input:focus {
        outline: 2px solid #0f766e;
        border-color: transparent;
      }
      button {
        margin-top: 0.5rem;
        padding: 0.85rem;
        border: 0;
        border-radius: 12px;
        background: #0f766e;
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
      }
      .error {
        color: #dc2626;
        font-size: 0.85rem;
        margin: 0;
      }
      .hint {
        text-align: center;
        color: #94a3b8;
        font-size: 0.75rem;
        margin: 0;
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = 'admin@paiejour.test';
  password = 'password';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/scan']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Connexion impossible.');
        this.loading.set(false);
      },
    });
  }
}
