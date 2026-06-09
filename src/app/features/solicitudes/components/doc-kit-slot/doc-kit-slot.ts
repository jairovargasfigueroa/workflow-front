import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Slot del kit para el solicitante al CREAR una solicitud.
 *
 * Diferencia con doc-producido-slot: este NO sube nada — solo guarda el File
 * en memoria y lo emite al parent. El parent (solicitud-dialog) acumula los
 * archivos y los sube todos en paralelo después de crear la solicitud.
 *
 * Tres estados visuales:
 *   - idle: "Seleccionar archivo"
 *   - seleccionado: muestra el File elegido + "Cambiar" / "Quitar"
 *   - subiendo / subido / error: se controlan desde el parent vía Inputs.
 */
@Component({
  selector: 'app-doc-kit-slot',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './doc-kit-slot.html',
  styleUrl: './doc-kit-slot.scss'
})
export class DocKitSlotComponent {
  @Input({ required: true }) nombre!: string;
  @Input() formatosAceptados: string[] = [];
  @Input() obligatorio = false;

  /** Estado externo controlado por el parent (durante/después del envío). */
  @Input() subiendo = false;
  @Input() subido = false;
  @Input() errorMensaje: string | null = null;

  @Output() archivoSeleccionado = new EventEmitter<File | null>();

  readonly archivo = signal<File | null>(null);

  get accept(): string {
    if (!this.formatosAceptados?.length) return '';
    return this.formatosAceptados.map(f => `.${f.toLowerCase()}`).join(',');
  }

  get formatosLabel(): string {
    if (!this.formatosAceptados?.length) return 'Cualquier formato';
    return this.formatosAceptados.map(f => f.toUpperCase()).join(' / ');
  }

  formatTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (file) this.setArchivo(file);
  }

  setArchivo(file: File): void {
    this.archivo.set(file);
    this.archivoSeleccionado.emit(file);
  }

  quitar(): void {
    if (this.subiendo) return;
    this.archivo.set(null);
    this.archivoSeleccionado.emit(null);
  }

  cambiar(fileInput: HTMLInputElement): void {
    if (this.subiendo) return;
    fileInput.click();
  }
}
