import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PRIORIDAD_LABELS,
  Prioridad,
  SEVERIDAD_LABELS,
  Severidad
} from '../../../../core/models/motor';
import { clasePrioridad, claseSeveridad } from '../../../../core/utils/motor.util';

@Component({
  selector: 'app-severidad-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './severidad-badge.html',
  styleUrl: './severidad-badge.scss'
})
export class SeveridadBadgeComponent {
  /** Si pasas `severidad` se usa eso. Si no, se usa `prioridad`. */
  @Input() severidad: Severidad | null | undefined = null;
  @Input() prioridad: Prioridad | null | undefined = null;

  get label(): string {
    if (this.severidad) return SEVERIDAD_LABELS[this.severidad];
    if (this.prioridad) return PRIORIDAD_LABELS[this.prioridad];
    return '—';
  }

  get clase(): string {
    if (this.severidad) return claseSeveridad(this.severidad);
    if (this.prioridad) return clasePrioridad(this.prioridad);
    return 'severidad-null';
  }
}
