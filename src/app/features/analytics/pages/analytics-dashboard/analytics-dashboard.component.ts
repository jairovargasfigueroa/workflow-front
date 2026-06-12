import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { AnalyticsService } from '../../services/analytics.service';
import { FlujoAnalytics } from '../../models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { ListSkeletonComponent } from '../../../../shared/components/ui/list-skeleton/list-skeleton';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    EmptyStateComponent,
    ListSkeletonComponent,
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);

  flujos = signal<FlujoAnalytics[]>([]);
  cargando = signal(true);
  error = signal(false);

  readonly columnas = ['nombre', 'salud', 'solicitudes'];

  ngOnInit(): void {
    this.analyticsService.getFlujos().subscribe({
      next: res => {
        this.flujos.set(res.flujos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  getSaludClass(puntaje: number): string {
    if (puntaje <= 40) return 'chip--riesgo-alto';
    if (puntaje <= 70) return 'chip--riesgo-medio';
    return 'chip--riesgo-bajo';
  }

  verDetalle(flujoId: string): void {
    this.router.navigate(['/analytics', flujoId]);
  }
}
