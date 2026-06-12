import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Anomalia } from '../../../../core/models/motor';
import { formatScore } from '../../../../core/utils/motor.util';
import { formatFechaAbsoluta } from '../../../../core/utils/sla.util';
import { SeveridadBadgeComponent } from '../severidad-badge/severidad-badge';

@Component({
  selector: 'app-anomalia-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SeveridadBadgeComponent
  ],
  templateUrl: './anomalia-card.html',
  styleUrl: './anomalia-card.scss'
})
export class AnomaliaCardComponent {
  @Input({ required: true }) anomalia!: Anomalia;
  /** Modo compacto (dashboard): 1 línea + un solo botón "Ver". */
  @Input() compact = false;
  /** Si false (compact), no muestra botón "Marcar falso positivo". */
  @Input() permiteDescartar = true;

  @Output() descartar = new EventEmitter<Anomalia>();

  private readonly router = inject(Router);

  get score(): string {
    return formatScore(this.anomalia.score);
  }

  /** "hace 2 horas" — adaptativo (min / horas / días). */
  get cuandoRelativo(): string {
    const ms = Date.now() - new Date(this.anomalia.detectada).getTime();
    if (ms < 60_000) return 'hace pocos segundos';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'hace 1 día' : `hace ${d} días`;
  }

  get fechaAbsoluta(): string {
    return formatFechaAbsoluta(this.anomalia.detectada);
  }

  /** Icono Material según severidad. */
  get icono(): string {
    switch (this.anomalia.severidad) {
      case 'CRITICA': return 'crisis_alert';
      case 'MEDIA': return 'warning';
      case 'BAJA': return 'info';
      default: return 'help';
    }
  }

  /** Tono visual (data-attribute) para colorear el icono. */
  get tono(): string {
    switch (this.anomalia.severidad) {
      case 'CRITICA': return 'danger';
      case 'MEDIA': return 'warning';
      default: return 'neutral';
    }
  }

  /** Tipo de anomalía en formato legible (ej: "solicitud_estancada" → "Solicitud estancada"). */
  get tipoLabel(): string {
    const t = this.anomalia.tipo ?? '';
    if (!t) return 'Anomalía';
    const limpio = t.replace(/_/g, ' ');
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  /** Sólo mostramos "Ver" si linkea a una solicitud (usuarios/:id no existe en el front). */
  get muestraVer(): boolean {
    return !!this.anomalia.solicitudIdAfectada;
  }

  onVer(): void {
    if (this.anomalia.solicitudIdAfectada) {
      this.router.navigate(['/solicitudes', this.anomalia.solicitudIdAfectada]);
    }
  }

  onDescartar(): void {
    this.descartar.emit(this.anomalia);
  }
}
