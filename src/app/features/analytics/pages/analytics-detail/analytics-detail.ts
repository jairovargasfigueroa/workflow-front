import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AnalyticsService } from '../../services/analytics.service';
import { OptimizarResponse } from '../../models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { MotorService } from '../../../../core/services/motor.service';
import { MejorRutaResponse, RiesgoResponse } from '../../../../core/models/motor';
import {
  MotorNoDisponibleComponent
} from '../../../../shared/components/ui/motor-no-disponible/motor-no-disponible';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { formatPorcentaje, formatProbabilidad } from '../../../../core/utils/motor.util';

@Component({
  selector: 'app-analytics-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    EmptyStateComponent,
    MotorNoDisponibleComponent,
  ],
  templateUrl: './analytics-detail.html',
  styleUrl: './analytics-detail.scss',
})
export class AnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private motorService = inject(MotorService);

  detalle = signal<OptimizarResponse | null>(null);
  cargando = signal(true);
  error = signal(false);

  mejorRuta = signal<MejorRutaResponse | null>(null);
  cargandoMejorRuta = signal(false);
  riesgo = signal<RiesgoResponse | null>(null);
  cargandoRiesgo = signal(false);

  private flujoId!: string;

  ngOnInit(): void {
    this.flujoId = this.route.snapshot.paramMap.get('id')!;
    this.analyticsService.optimizarFlujo(this.flujoId).subscribe({
      next: res => {
        this.detalle.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });

    // Llamadas al motor en paralelo e independientes — no bloquean el análisis principal.
    this.cargarMejorRuta();
    this.cargarRiesgo();
  }

  cargarMejorRuta(): void {
    this.cargandoMejorRuta.set(true);
    this.motorService.getMejorRuta(this.flujoId).subscribe(res => {
      this.mejorRuta.set(res);
      this.cargandoMejorRuta.set(false);
    });
  }

  cargarRiesgo(): void {
    this.cargandoRiesgo.set(true);
    this.motorService.getRiesgo(this.flujoId).subscribe(res => {
      this.riesgo.set(res);
      this.cargandoRiesgo.set(false);
    });
  }

  formatPct(n: number | null | undefined): string {
    return formatPorcentaje(n);
  }

  formatProb(n: number | null | undefined): string {
    return formatProbabilidad(n);
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
