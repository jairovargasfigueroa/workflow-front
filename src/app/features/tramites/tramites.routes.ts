import { Routes } from '@angular/router';

export const TRAMITES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tramites-list/tramites-list')
      .then(m => m.TramitesListComponent)
  }
];
