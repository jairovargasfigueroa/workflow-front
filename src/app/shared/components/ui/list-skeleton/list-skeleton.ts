import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton loader para listas / tablas — placeholder animado mientras carga.
 *
 * Reemplaza al `<mat-spinner>` clásico con barras grises pulsantes que dan
 * sensación de velocidad y de "ya casi está".
 *
 * Uso:
 *   <app-list-skeleton [filas]="6" [columnas]="4" />
 *   <app-list-skeleton variante="cards" [filas]="3" />
 */
@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-skeleton.html',
  styleUrl: './list-skeleton.scss'
})
export class ListSkeletonComponent {
  /** Cantidad de filas (o cards) a renderizar. Default: 5 */
  filas = input<number>(5);
  /** Cantidad de columnas por fila (solo aplica a variante 'tabla'). Default: 4 */
  columnas = input<number>(4);
  /** Estilo del skeleton: 'tabla' (filas con columnas) o 'cards' (bloques). Default: 'tabla' */
  variante = input<'tabla' | 'cards'>('tabla');

  get filasArray(): number[] {
    return Array.from({ length: this.filas() });
  }

  get columnasArray(): number[] {
    return Array.from({ length: this.columnas() });
  }
}
