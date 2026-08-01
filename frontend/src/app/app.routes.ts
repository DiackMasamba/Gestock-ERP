import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'scan' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/scanner/scanner.component').then((m) => m.ScannerComponent),
  },
  { path: '**', redirectTo: 'scan' },
];
