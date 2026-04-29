import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-dashboard/analytics-dashboard.component').then(
        m => m.AnalyticsDashboardComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/analytics-detail/analytics-detail').then(m => m.AnalyticsDetailComponent),
  },
];
