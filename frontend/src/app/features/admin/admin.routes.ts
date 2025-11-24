import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'predefined-values',
    pathMatch: 'full'
  },
  {
    path: 'predefined-values',
    loadComponent: () => import('./predefined-values/predefined-values.component').then(m => m.PredefinedValuesComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
  }
];
