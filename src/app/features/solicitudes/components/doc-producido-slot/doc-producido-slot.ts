import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { ArchivosService } from '../../services/archivos.service';
import { ArchivoResponse } from '../../models/archivo.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

export type SlotStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

@Component({
  selector: 'app-doc-producido-slot',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './doc-producido-slot.html',
  styleUrl: './doc-producido-slot.scss'
})
export class DocProducidoSlotComponent {
  @Input({ required: true }) nombre!: string;
  @Input({ required: true }) solicitudId!: string;
  @Input({ required: true }) departamentoOrigenId!: string;
  @Input() formatosAceptados: string[] = [];
  @Input() obligatorio = false;
  /** Si ya hay un archivo subido para este documento, lo pasamos como estado inicial. */
  @Input() set archivoExistente(value: ArchivoResponse | null) {
    this._archivo = value;
    this.status.set(value ? 'uploaded' : 'idle');
  }
  get archivo(): ArchivoResponse | null { return this._archivo; }

  @Output() subido = new EventEmitter<ArchivoResponse>();
  @Output() reemplazado = new EventEmitter<ArchivoResponse>();

  private readonly archivosService = inject(ArchivosService);
  private readonly notification = inject(NotificationService);

  readonly status = signal<SlotStatus>('idle');
  readonly errorMessage = signal<string | null>(null);

  private _archivo: ArchivoResponse | null = null;

  get accept(): string {
    if (!this.formatosAceptados?.length) return '';
    return this.formatosAceptados.map(f => `.${f.toLowerCase()}`).join(',');
  }

  get formatosLabel(): string {
    if (!this.formatosAceptados?.length) return '';
    return this.formatosAceptados.map(f => f.toUpperCase()).join(' / ');
  }

  formatTamano(bytes: number | undefined | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.subir(file);
  }

  private subir(file: File): void {
    this.status.set('uploading');
    this.errorMessage.set(null);

    this.archivosService.upload({
      archivo: file,
      solicitudId: this.solicitudId,
      campoFormulario: this.nombre,                  // nombre EXACTO del documento producido
      departamentoOrigenId: this.departamentoOrigenId
    }).subscribe({
      next: archivo => {
        const reemplazo = this._archivo !== null;
        this._archivo = archivo;
        this.status.set('uploaded');
        if (reemplazo) this.reemplazado.emit(archivo);
        else this.subido.emit(archivo);
      },
      error: (err: HttpErrorResponse) => {
        const msg = mapHttpErrorToUserMessage(err);
        this.status.set('error');
        this.errorMessage.set(msg);
        this.notification.add({ title: 'Error al subir', message: msg, type: 'error' });
      }
    });
  }

  async cambiar(fileInput: HTMLInputElement): Promise<void> {
    if (this._archivo) {
      try {
        await firstValueFrom(this.archivosService.eliminar(this._archivo.id, this.solicitudId));
      } catch (err) {
        const msg = mapHttpErrorToUserMessage(err as HttpErrorResponse);
        this.notification.add({ title: 'No se pudo reemplazar', message: msg, type: 'error' });
        return;
      }
      this._archivo = null;
      this.status.set('idle');
    }
    fileInput.click();
  }

  reintentar(fileInput: HTMLInputElement): void {
    this.status.set('idle');
    this.errorMessage.set(null);
    fileInput.click();
  }
}
