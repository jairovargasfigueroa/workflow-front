import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ANOMALIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/anomalias-list/anomalias-list').then(m => m.AnomaliasListComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  }
];
