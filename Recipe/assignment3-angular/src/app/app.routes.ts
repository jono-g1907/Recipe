import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Logout } from './auth/logout/logout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'logout', component: Logout },
  { path: '**', redirectTo: 'dashboard' }
];
