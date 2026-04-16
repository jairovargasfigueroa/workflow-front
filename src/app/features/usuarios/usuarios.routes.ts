import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/usuarios-list/usuarios-list')
      .then(m => m.UsuariosListComponent)
  }
];
