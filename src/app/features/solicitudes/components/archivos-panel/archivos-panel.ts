import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subject, filter, firstValueFrom, takeUntil } from 'rxjs';

import { ArchivosService } from '../../services/archivos.service';
import { ArchivoResponse, FORMATOS_EDITABLES_ONLYOFFICE } from '../../models/archivo.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { ArchivoHistorialModalComponent } from '../archivo-historial-modal/archivo-historial-modal';
import { ArchivoAuditoriaModalComponent } from '../archivo-auditoria-modal/archivo-auditoria-modal';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-archivos-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './archivos-panel.html',
  styleUrl: './archivos-panel.scss'
})
export class ArchivosPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) solicitudId!: string;
  @Input() showSubirExtra = true;

  private readonly archivosService = inject(ArchivosService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly matDialog = inject(MatDialog);

  archivos: ArchivoResponse[] = [];
  loading = false;
  uploadingExtra = false;

  private readonly destroy$ = new Subject<void>();

  readonly puedeGestionar = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'ADMIN' || rol === 'FUNCIONARIO';
  });

  // TODO: restringir a solo ADMIN cuando el admin tenga acceso a solicitudes en la app.
  readonly puedeVerAuditoria = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'ADMIN' || rol === 'FUNCIONARIO';
  });

  ngOnInit(): void {
    this.cargar();
    this.archivosService.changes$.pipe(
      takeUntil(this.destroy$),
      filter(id => id === this.solicitudId)
    ).subscribe(() => this.cargar());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['solicitudId'] && !changes['solicitudId'].firstChange) {
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    if (!this.solicitudId) return;
    this.loading = true;
    this.archivosService.listarPorSolicitud(this.solicitudId).subscribe({
      next: archivos => {
        this.archivos = archivos.filter(a => a.estado === 'ACTIVO');
        this.loading = false;
      },
      error: err => {
        this.handleError(err, 'No se pudo cargar los archivos del expediente');
        this.loading = false;
      }
    });
  }

  async descargar(archivo: ArchivoResponse): Promise<void> {
    try {
      const res = await firstValueFrom(this.archivosService.descargar(archivo.id));
      window.open(res.urlDescarga, '_blank');
    } catch (err) {
      this.handleError(err as HttpErrorResponse, 'No se pudo descargar el archivo');
    }
  }

  onNuevaVersion(archivo: ArchivoResponse, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.archivosService.nuevaVersion(archivo.id, file, this.solicitudId).subscribe({
      next: () => {
        this.notification.add({
          title: 'Nueva versión subida',
          message: `Se actualizó "${archivo.nombre}"`,
          type: 'success'
        });
      },
      error: err => this.handleError(err, 'No se pudo subir la nueva versión')
    });
  }

  async eliminar(archivo: ArchivoResponse): Promise<void> {
    const confirmado = await firstValueFrom(
      this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Eliminar archivo?',
          message: `Se eliminará "${archivo.nombre}" del expediente. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          confirmColor: 'warn'
        }
      }).afterClosed()
    );
    if (!confirmado) return;

    this.archivosService.eliminar(archivo.id, this.solicitudId).subscribe({
      next: () => {
        this.notification.add({
          title: 'Archivo eliminado',
          message: `"${archivo.nombre}" fue eliminado del expediente`,
          type: 'success'
        });
      },
      error: err => this.handleError(err, 'No se pudo eliminar el archivo')
    });
  }

  abrirHistorial(archivo: ArchivoResponse): void {
    this.matDialog.open(ArchivoHistorialModalComponent, {
      data: { archivo },
      width: '640px',
      maxHeight: '85vh'
    });
  }

  abrirAuditoria(archivo: ArchivoResponse): void {
    this.matDialog.open(ArchivoAuditoriaModalComponent, {
      data: { archivoId: archivo.id, nombreArchivo: archivo.nombre },
      width: '720px',
      maxHeight: '85vh'
    });
  }

  puedeEditarOnline(archivo: ArchivoResponse): boolean {
    if (!this.puedeGestionar()) return false;
    if (archivo.inmutable) return false;
    const formato = archivo.formato?.toLowerCase();
    return (FORMATOS_EDITABLES_ONLYOFFICE as readonly string[]).includes(formato);
  }

  abrirEditorOnline(archivo: ArchivoResponse): void {
    window.open(`/archivos/${archivo.id}/editar`, '_blank');
  }

  onSubirExtra(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const departamentoId = this.authService.currentUser()?.departamentoId ?? undefined;
    this.uploadingExtra = true;
    this.archivosService.upload({
      archivo: file,
      solicitudId: this.solicitudId,
      departamentoOrigenId: departamentoId
    }).subscribe({
      next: () => {
        this.uploadingExtra = false;
        this.notification.add({
          title: 'Archivo subido',
          message: `Se agregó "${file.name}" al expediente`,
          type: 'success'
        });
      },
      error: err => {
        this.uploadingExtra = false;
        this.handleError(err, 'No se pudo subir el archivo');
      }
    });
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
