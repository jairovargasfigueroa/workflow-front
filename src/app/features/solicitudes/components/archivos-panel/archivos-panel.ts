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
import { ArchivoResponse } from '../../models/archivo.model';
import {
  caminoVer,
  esEditableOnline,
  puedeVerse
} from '../../../../core/utils/formato-archivo.util';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
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
  /**
   * Cuando hay una tarea activa identificable (respuesta-dialog), pasar acá su
   * departamentoId. El archivo extra hereda permisos ad-hoc de ESE nodo.
   * Si no se pasa, fallback al depto del usuario actual (con riesgo de permisos vacíos).
   */
  @Input() departamentoOrigenId: string | null = null;
  /** Si false, oculta "Subir archivo extra" aunque el rol lo permita. */
  @Input() mostrarSubirExtra = true;

  private readonly archivosService = inject(ArchivosService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
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

  // ----- Ver / Editar / Descargar (decisión por formato) -----

  puedeVer(archivo: ArchivoResponse): boolean {
    return puedeVerse(archivo.formato);
  }

  puedeEditarOnline(archivo: ArchivoResponse): boolean {
    if (!this.puedeGestionar()) return false;
    if (archivo.inmutable) return false;
    return esEditableOnline(archivo.formato);
  }

  async ver(archivo: ArchivoResponse): Promise<void> {
    const camino = caminoVer(archivo.formato);
    if (camino === 'onlyoffice') {
      window.open(`/archivos/${archivo.id}/abrir?soloVista=true`, '_blank');
      return;
    }
    if (camino === 'navegador') {
      try {
        const res = await firstValueFrom(this.archivosService.descargar(archivo.id, false));
        window.open(res.urlDescarga, '_blank');
      } catch (err) {
        this.handleError(err as HttpErrorResponse, 'No se pudo abrir el archivo');
      }
      return;
    }
    // 'descargar' (binarios) — fallback al método de descarga
    this.descargar(archivo);
  }

  editarOnline(archivo: ArchivoResponse): void {
    window.open(`/archivos/${archivo.id}/abrir?soloVista=false`, '_blank');
  }

  async descargar(archivo: ArchivoResponse): Promise<void> {
    try {
      const res = await firstValueFrom(this.archivosService.descargar(archivo.id, true));
      const link = document.createElement('a');
      link.href = res.urlDescarga;
      link.download = archivo.nombre;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
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
        this.feedback.success(`Nueva versión subida — "${archivo.nombre}"`);
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
        this.feedback.success(`"${archivo.nombre}" fue eliminado del expediente`);
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

  onSubirExtra(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    // Prioridad: depto de la tarea activa > depto del usuario.
    const departamentoId = this.departamentoOrigenId
      ?? this.authService.currentUser()?.departamentoId
      ?? undefined;
    this.uploadingExtra = true;
    this.archivosService.upload({
      archivo: file,
      solicitudId: this.solicitudId,
      departamentoOrigenId: departamentoId
    }).subscribe({
      next: () => {
        this.uploadingExtra = false;
        this.feedback.success(`Se agregó "${file.name}" al expediente`);
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

  private handleError(err: HttpErrorResponse, _fallback: string): void {
    this.feedback.error(mapHttpErrorToUserMessage(err));
  }
}
