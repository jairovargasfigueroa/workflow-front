import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AnalyticsService } from '../../services/analytics.service';
import { OptimizarResponse } from '../../models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';

@Component({
  selector: 'app-analytics-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    EmptyStateComponent,
  ],
  templateUrl: './analytics-detail.html',
  styleUrl: './analytics-detail.scss',
})
export class AnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);

  detalle = signal<OptimizarResponse | null>(null);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const flujoId = this.route.snapshot.paramMap.get('id')!;
    this.analyticsService.optimizarFlujo(flujoId).subscribe({
      next: res => {
        this.detalle.set(res);
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

  getRiesgoClass(nivel: string): string {
    const map: Record<string, string> = {
      ALTO: 'prioridad-alta',
      MEDIO: 'prioridad-media',
      BAJO: 'prioridad-baja',
    };
    return map[nivel] ?? '';
  }

  getPrioridadClass(prioridad: string): string {
    const map: Record<string, string> = {
      ALTA: 'prioridad-alta',
      MEDIA: 'prioridad-media',
      BAJA: 'prioridad-baja',
    };
    return map[prioridad] ?? '';
  }

  volver(): void {
    this.router.navigate(['/analytics']);
  }
}
