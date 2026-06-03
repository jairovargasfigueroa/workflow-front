import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/chat/chat').then(m => m.ChatComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'FUNCIONARIO'] }
  }
];
