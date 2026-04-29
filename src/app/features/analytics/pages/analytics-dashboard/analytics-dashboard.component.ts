import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AnalyticsService } from '../../services/analytics.service';
import { FlujoAnalytics } from '../../models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    EmptyStateComponent,
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
    if (puntaje <= 40) return 'prioridad-alta';
    if (puntaje <= 70) return 'prioridad-media';
    return 'prioridad-baja';
  }

  verDetalle(flujoId: string): void {
    this.router.navigate(['/analytics', flujoId]);
  }
}
