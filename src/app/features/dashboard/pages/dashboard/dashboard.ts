import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MotorService } from '../../../../core/services/motor.service';
import {
  Anomalia,
  DashboardPrioridadResponse,
  TopUrgente
} from '../../../../core/models/motor';
import { AuthService } from '../../../../core/services/auth.service';
import { AnomaliaCardComponent } from '../../../../shared/components/ui/anomalia-card/anomalia-card';
import {
  MotorNoDisponibleComponent
} from '../../../../shared/components/ui/motor-no-disponible/motor-no-disponible';
import {
  SeveridadBadgeComponent
} from '../../../../shared/components/ui/severidad-badge/severidad-badge';
import { SlaBadgeComponent } from '../../../../shared/components/ui/sla-badge/sla-badge';
import { formatDuracion } from '../../../../core/utils/sla.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AnomaliaCardComponent,
    MotorNoDisponibleComponent,
    SeveridadBadgeComponent,
    SlaBadgeComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private readonly motorService = inject(MotorService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ----- saludo -----
  readonly nombreUsuario = computed(() => this.authService.currentUser()?.nombre ?? '');
  readonly fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ----- sección Motor (solo ADMIN) -----
  readonly esAdmin = computed(() => this.authService.currentUser()?.rol === 'ADMIN');

  readonly prioridad = signal<DashboardPrioridadResponse | null>(null);
  readonly anomaliasRecientes = signal<Anomalia[]>([]);
  readonly anomaliasDisponible = signal(true);
  readonly cargandoPrioridad = signal(false);
  readonly cargandoAnomalias = signal(false);

  ngOnInit(): void {
    if (this.esAdmin()) this.cargarMotor();
  }

  cargarMotor(): void {
    this.cargarPrioridad();
    this.cargarAnomaliasRecientes();
  }

  cargarPrioridad(): void {
    this.cargandoPrioridad.set(true);
    this.motorService.getDashboardPrioridad().subscribe(res => {
      this.prioridad.set(res);
      this.cargandoPrioridad.set(false);
    });
  }

  cargarAnomaliasRecientes(): void {
    this.cargandoAnomalias.set(true);
    this.motorService.getAnomalias({ page: 0, size: 3 }).subscribe(res => {
      this.anomaliasDisponible.set(res.disponible);
      this.anomaliasRecientes.set(res.contenido ?? []);
      this.cargandoAnomalias.set(false);
    });
  }

  irASolicitud(t: TopUrgente): void {
    this.router.navigate(['/solicitudes', t.solicitudId]);
  }

  irAAnomalias(): void {
    this.router.navigate(['/anomalias']);
  }

  /** Convierte `horasHastaLimite` (puede ser negativo si está vencido) a string adaptativo. */
  formatHorasHastaLimite(horas: number | null | undefined): string {
    if (horas == null || !Number.isFinite(horas)) return '';
    const ms = horas * 3_600_000;
    if (ms < 0) return `vencido hace ${formatDuracion(-ms)}`;
    return `vence en ${formatDuracion(ms)}`;
  }
}
