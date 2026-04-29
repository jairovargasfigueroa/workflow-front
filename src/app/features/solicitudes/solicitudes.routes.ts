import { Routes } from '@angular/router';

export const SOLICITUDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/solicitudes-list/solicitudes-list')
      .then(m => m.SolicitudesListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/solicitud-detail/solicitud-detail')
      .then(m => m.SolicitudDetailComponent)
  }
];
