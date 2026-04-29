import { Routes } from '@angular/router';

export const DEPARTAMENTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/departamentos-list/departamentos-list')
      .then(m => m.DepartamentosListComponent)
  }
];
