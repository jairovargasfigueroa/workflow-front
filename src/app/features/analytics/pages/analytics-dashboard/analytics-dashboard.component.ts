import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsResponse, TramiteOpcion } from '../../models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatListModule,
    MatIconModule,
    EmptyStateComponent
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  tramites = signal<TramiteOpcion[]>([]);
  tramiteSeleccionado = signal<string>('');
  resultado = signal<AnalyticsResponse | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    this.analyticsService.getTramites().subscribe(data => this.tramites.set(data));
  }

  onTramiteChange(tramiteId: string): void {
    this.tramiteSeleccionado.set(tramiteId);
    if (!tramiteId) {
      this.resultado.set(null);
      return;
    }
    this.cargando.set(true);
    this.analyticsService.getCuellosDeBottella(tramiteId).subscribe({
      next: data => {
        this.resultado.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  getPrioridad(importancia: number): string {
    if (importancia > 0.5) return 'alta';
    if (importancia >= 0.2) return 'media';
    return 'baja';
  }

  getPrioridadLabel(importancia: number): string {
    if (importancia > 0.5) return 'Alta prioridad';
    if (importancia >= 0.2) return 'Media';
    return 'Baja';
  }
}
