import { Routes } from '@angular/router';

export const FORMULARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/formularios-list/formularios-list')
      .then(m => m.FormulariosListComponent)
  }
];
