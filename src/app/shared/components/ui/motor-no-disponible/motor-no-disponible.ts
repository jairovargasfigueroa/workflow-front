import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-motor-no-disponible',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './motor-no-disponible.html',
  styleUrl: './motor-no-disponible.scss'
})
export class MotorNoDisponibleComponent {
  /** Si true, muestra el bloque más chico (apto para incrustar dentro de cards de dashboard). */
  @Input() compact = false;
  /** Mensaje opcional personalizado. */
  @Input() mensaje = 'Motor no disponible momentáneamente. Reintentá en unos minutos.';
  /** Si true, muestra botón "Reintentar" que emite (reintentar). */
  @Input() conReintento = true;
  @Output() reintentar = new EventEmitter<void>();
}
