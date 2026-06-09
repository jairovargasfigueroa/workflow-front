import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REPOSITORIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/repositorio-list/repositorio-list').then(m => m.RepositorioListComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  }
];
