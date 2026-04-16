import { Routes } from '@angular/router';

export const FLUJOS_TRABAJO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/flujos-trabajo-list/flujos-trabajo-list')
      .then(m => m.FlujosTrabajoListComponent)
  },
  {
    path: ':id/editor',
    loadComponent: () => import('./pages/flujo-trabajo-editor/flujo-trabajo-editor')
      .then(m => m.FlujoTrabajoEditorComponent)
  }
];
