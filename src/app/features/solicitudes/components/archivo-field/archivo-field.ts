import { Component, Input, OnDestroy, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, firstValueFrom } from 'rxjs';

import { ArchivosService } from '../../services/archivos.service';
import { ArchivoResponse } from '../../models/archivo.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

export type ArchivoFieldStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

@Component({
  selector: 'app-archivo-field',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ArchivoFieldComponent),
      multi: true
    }
  ],
  templateUrl: './archivo-field.html',
  styleUrl: './archivo-field.scss'
})
export class ArchivoFieldComponent implements ControlValueAccessor, OnDestroy {
  @Input({ required: true }) solicitudId!: string;
  @Input() campoFormulario: string | null = null;
  @Input() departamentoOrigenId: string | null = null;
  @Input() label = '';
  @Input() requerido = false;
  @Input() accept = '';

  private readonly archivosService = inject(ArchivosService);
  private readonly notification = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  status: ArchivoFieldStatus = 'idle';
  archivo: ArchivoResponse | null = null;
  errorMessage: string | null = null;
  disabled = false;

  private onChange: (v: ArchivoResponse | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: ArchivoResponse | null): void {
    this.archivo = v;
    this.status = v ? 'uploaded' : 'idle';
    this.errorMessage = null;
  }

  registerOnChange(fn: (v: ArchivoResponse | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.subir(file);
  }

  private subir(file: File): void {
    this.status = 'uploading';
    this.errorMessage = null;
    this.onTouched();

    this.archivosService.upload({
      archivo: file,
      solicitudId: this.solicitudId,
      campoFormulario: this.campoFormulario,
      departamentoOrigenId: this.departamentoOrigenId
    }).subscribe({
      next: archivo => {
        this.archivo = archivo;
        this.status = 'uploaded';
        this.onChange(archivo);
      },
      error: err => {
        const msg = mapHttpErrorToUserMessage(err);
        this.status = 'error';
        this.errorMessage = msg;
        this.archivo = null;
        this.onChange(null);
        this.notification.add({
          title: 'Error al subir archivo',
          message: msg,
          type: 'error'
        });
      }
    });
  }

  async cambiar(fileInput: HTMLInputElement): Promise<void> {
    if (this.archivo) {
      try {
        await firstValueFrom(this.archivosService.eliminar(this.archivo.id, this.solicitudId));
      } catch (err) {
        this.handleError(err as HttpErrorResponse, 'No se pudo eliminar el archivo anterior');
        return;
      }
      this.archivo = null;
      this.status = 'idle';
      this.errorMessage = null;
      this.onChange(null);
    }
    fileInput.click();
  }

  reintentar(fileInput: HTMLInputElement): void {
    this.status = 'idle';
    this.errorMessage = null;
    fileInput.click();
  }

  formatTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private handleError(err: HttpErrorResponse, fallback: string): void {
    this.notification.add({ title: fallback, message: mapHttpErrorToUserMessage(err), type: 'error' });
  }
}
