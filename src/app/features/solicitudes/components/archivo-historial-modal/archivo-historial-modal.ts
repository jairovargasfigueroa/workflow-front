import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { ArchivosService } from '../../services/archivos.service';
import { ArchivoResponse } from '../../models/archivo.model';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { ArchivoAuditoriaModalComponent } from '../archivo-auditoria-modal/archivo-auditoria-modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';
import { caminoVer, puedeVerse } from '../../../../core/utils/formato-archivo.util';

export interface ArchivoHistorialModalData {
  archivo: ArchivoResponse;
  /** Si true, oculta el botón "Revertir" (vista de consulta, ej. repositorio). */
  soloLectura?: boolean;
}

@Component({
  selector: 'app-archivo-historial-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './archivo-historial-modal.html',
  styleUrl: './archivo-historial-modal.scss'
})
export class ArchivoHistorialModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ArchivoHistorialModalComponent>);
  private readonly data = inject<ArchivoHistorialModalData>(MAT_DIALOG_DATA);
  private readonly archivosService = inject(ArchivosService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly matDialog = inject(MatDialog);

  archivo = this.data.archivo;
  soloLectura = this.data.soloLectura ?? false;
  versiones: ArchivoResponse[] = [];
  loading = true;
  reverting: number | null = null;

  // Mismo criterio que en archivos-panel: ADMIN o FUNCIONARIO ven auditoría.
  readonly puedeVerAuditoria = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'ADMIN' || rol === 'FUNCIONARIO';
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.archivosService.listarVersiones(this.archivo.id).subscribe({
      next: v => {
        this.versiones = v;
        this.loading = false;
      },
      error: err => {
        this.handleError(err, 'No se pudo cargar el historial');
        this.loading = false;
      }
    });
  }

  versionActual(v: ArchivoResponse): boolean {
    return v.estado === 'ACTIVO';
  }

  puedeVer(v: ArchivoResponse): boolean {
    return puedeVerse(v.formato);
  }

  async ver(v: ArchivoResponse): Promise<void> {
    const camino = caminoVer(v.formato);
    if (camino === 'onlyoffice') {
      // Cualquier versión (incluso vieja) se puede abrir en lectura.
      window.open(`/archivos/${v.id}/abrir?soloVista=true`, '_blank');
      return;
    }
    if (camino === 'navegador') {
      try {
        const res = await firstValueFrom(this.archivosService.descargar(v.id, false));
        window.open(res.urlDescarga, '_blank');
      } catch (err) {
        this.handleError(err as HttpErrorResponse, 'No se pudo abrir la versión');
      }
      return;
    }
    // 'descargar' (binarios) — fallback al método de descarga
    this.descargar(v);
  }

  async descargar(v: ArchivoResponse): Promise<void> {
    try {
      const res = await firstValueFrom(this.archivosService.descargar(v.id, true));
      const link = document.createElement('a');
      link.href = res.urlDescarga;
      link.download = v.nombre;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      this.handleError(err as HttpErrorResponse, 'No se pudo descargar la versión');
    }
  }

  async revertir(v: ArchivoResponse): Promise<void> {
    const confirmado = await firstValueFrom(
      this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Revertir a esta versión?',
          message: `La versión v${v.version} se promoverá como actual. Se creará una nueva versión copia de esta.`,
          confirmText: 'Revertir',
          cancelText: 'Cancelar',
          confirmColor: 'primary'
        }
      }).afterClosed()
    );
    if (!confirmado) return;

    this.reverting = v.version;
    this.archivosService.revertir(this.archivo.id, v.version, this.archivo.solicitudId).subscribe({
      next: () => {
        this.notification.add({
          title: 'Versión revertida',
          message: `Se revirtió a v${v.version}`,
          type: 'success'
        });
        this.reverting = null;
        this.cargar();
      },
      error: err => {
        this.reverting = null;
        this.handleError(err, 'No se pudo revertir la versión');
      }
    });
  }

  formatTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  abrirAuditoria(v: ArchivoResponse): void {
    // Misma modal de auditoría, pero pasándole el id de la versión específica.
    // El endpoint GET /auditoria/archivos acepta cualquier archivoId (incluso versiones REEMPLAZADAS).
    this.matDialog.open(ArchivoAuditoriaModalComponent, {
      data: {
        archivoId: v.id,
        nombreArchivo: `${v.nombre} (v${v.version})`
      },
      width: '720px',
      maxHeight: '85vh'
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private handleError(err: HttpErrorResponse, fallback: string): void {
    this.notification.add({ title: fallback, message: mapHttpErrorToUserMessage(err), type: 'error' });
  }
}
