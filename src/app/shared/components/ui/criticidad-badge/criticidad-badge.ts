import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  CRITICIDAD_ICONOS,
  CRITICIDAD_LABELS,
  Criticidad,
  claseCriticidad
} from '../../../../core/models/sla';

@Component({
  selector: 'app-criticidad-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './criticidad-badge.html',
  styleUrl: './criticidad-badge.scss'
})
export class CriticidadBadgeComponent {
  @Input() criticidad: Criticidad | null | undefined = null;

  get clase(): string {
    return claseCriticidad(this.criticidad);
  }

  get label(): string {
    if (!this.criticidad) return 'Sin clasificar';
    return CRITICIDAD_LABELS[this.criticidad];
  }

  get icono(): string {
    if (!this.criticidad) return 'remove';
    return CRITICIDAD_ICONOS[this.criticidad];
  }
}
