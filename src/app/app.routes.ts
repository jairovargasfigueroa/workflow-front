import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'departamentos',
        loadChildren: () => import('./features/departamentos/departamentos.routes').then(m => m.DEPARTAMENTOS_ROUTES)
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES)
      },
      {
        path: 'formularios',
        loadChildren: () => import('./features/formularios/formularios.routes').then(m => m.FORMULARIOS_ROUTES)
      },
      {
        path: 'tramites',
        loadChildren: () => import('./features/tramites/tramites.routes').then(m => m.TRAMITES_ROUTES)
      },
      {
        path: 'solicitudes',
        loadChildren: () => import('./features/solicitudes/solicitudes.routes').then(m => m.SOLICITUDES_ROUTES)
      },
      {
        path: 'flujos-trabajo',
        loadChildren: () => import('./features/flujos-trabajo/flujos-trabajo.routes').then(m => m.FLUJOS_TRABAJO_ROUTES)
      },
      {
        path: 'analytics',
        loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES)
      }
    ]
  }
];
