import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { EstadoSla, ESTADO_SLA_LABELS, claseEstadoSla } from '../../../../core/models/sla';
import { formatFechaAbsoluta } from '../../../../core/utils/sla.util';

@Component({
  selector: 'app-sla-badge',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule],
  templateUrl: './sla-badge.html',
  styleUrl: './sla-badge.scss'
})
export class SlaBadgeComponent {
  /** Estado del SLA. Si es null/undefined → renderiza '—' gris. */
  @Input() estado: EstadoSla | null | undefined = null;
  /** Fecha límite ISO; cuando se pasa, el tooltip muestra "Vence el …". */
  @Input() fechaLimite: string | null | undefined = null;
  /** 'dot' (default) = círculo chico (lista). 'pill' = chip con label (detalle). */
  @Input() variante: 'dot' | 'pill' = 'dot';

  private readonly estado$ = signal<EstadoSla | null | undefined>(null);

  ngOnChanges(): void {
    this.estado$.set(this.estado);
  }

  readonly clase = computed(() => claseEstadoSla(this.estado$()));

  get label(): string {
    if (!this.estado) return 'Sin SLA';
    return ESTADO_SLA_LABELS[this.estado];
  }

  get tooltip(): string {
    if (!this.estado) return 'Este trámite no tiene SLA configurado';
    const fecha = formatFechaAbsoluta(this.fechaLimite);
    return fecha ? `${this.label} — Vence el ${fecha}` : this.label;
  }
}
