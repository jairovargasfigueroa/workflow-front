import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import { FlujoTrabajo, EstadoFlujo } from '../../models/flujo-trabajo.model';
import { FlujoTrabajoDialogComponent } from '../../components/flujo-trabajo-dialog/flujo-trabajo-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { ListSkeletonComponent } from '../../../../shared/components/ui/list-skeleton/list-skeleton';
import { FeedbackService } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-flujos-trabajo-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    ListSkeletonComponent
  ],
  templateUrl: './flujos-trabajo-list.html',
  styleUrl: './flujos-trabajo-list.scss'
})
export class FlujosTrabajoListComponent implements OnInit {
  private readonly flujosService = inject(FlujosTrabajoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  flujos = signal<FlujoTrabajo[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'version', 'estadoFlujo', 'acciones'];

  ngOnInit(): void {
    this.loadFlujos();
  }

  loadFlujos(): void {
    this.loading.set(true);
    this.flujosService.getAll().subscribe({
      next: (data) => {
        this.flujos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  tieneBorrador(flujo: FlujoTrabajo): boolean {
    return flujo.tieneBorrador;
  }

  getEstadoChipLabel(flujo: FlujoTrabajo): string {
    if (flujo.estadoFlujo === 'SIN_PUBLICAR') {
      return flujo.tieneBorrador ? 'Sin publicar' : 'Sin diseñar';
    }
    const labels: Record<EstadoFlujo, string> = {
      SIN_PUBLICAR: 'Sin publicar',
      ACTIVO: 'Publicado',
      DESACTIVADO: 'Desactivado',
      ARCHIVADO: 'Archivado'
    };
    return labels[flujo.estadoFlujo];
  }

  getEstadoChipClass(flujo: FlujoTrabajo): string {
    const map: Record<EstadoFlujo, string> = {
      SIN_PUBLICAR: 'chip--flujo-sin-publicar',
      ACTIVO: 'chip--flujo-activo',
      DESACTIVADO: 'chip--flujo-desactivado',
      ARCHIVADO: 'chip--flujo-archivado'
    };
    return map[flujo.estadoFlujo] ?? '';
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FlujoTrabajoDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadFlujos();
    });
  }

  openEditDialog(flujo: FlujoTrabajo): void {
    const dialogRef = this.dialog.open(FlujoTrabajoDialogComponent, {
      width: '600px',
      data: { mode: 'edit', flujo }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadFlujos();
    });
  }

  abrirEditor(flujo: FlujoTrabajo): void {
    this.router.navigate(['/flujos-trabajo', flujo.id, 'editor']);
  }

  verFlujo(flujo: FlujoTrabajo): void {
    this.router.navigate(['/flujos-trabajo', flujo.id, 'ver']);
  }

  publicarDesdeList(flujo: FlujoTrabajo): void {
    this.flujosService.publicar(flujo.id).subscribe({
      next: () => {
        this.feedback.success(`El flujo "${flujo.nombre}" se publicó correctamente`);
        this.loadFlujos();
      },
      error: (error) => {
        const errores: string[] = error?.error?.errores ?? [];
        this.feedback.error(
          errores.length > 0
            ? errores[0]
            : 'El diagrama tiene errores. Ábrelo en el editor para verlos.'
        );
      }
    });
  }

  descartarDesdeList(flujo: FlujoTrabajo): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Descartar borrador',
        message: `¿Descartar los cambios sin publicar de "${flujo.nombre}"?`,
        confirmText: 'Descartar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.flujosService.descartarBorrador(flujo.id).subscribe({
        next: () => {
          this.feedback.success(`Los cambios de "${flujo.nombre}" fueron descartados`);
          this.loadFlujos();
        },
        error: () => {
          this.feedback.error('No se pudo descartar el borrador');
        }
      });
    });
  }

  cambiarEstado(flujo: FlujoTrabajo, estado: EstadoFlujo): void {
    const accion = estado === 'ACTIVO' ? 'activar' : estado === 'DESACTIVADO' ? 'desactivar' : 'archivar';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} flujo`,
        message: `¿Estás seguro de ${accion} el flujo "${flujo.nombre}"?`,
        confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
        cancelText: 'Cancelar'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.flujosService.cambiarEstado(flujo.id, { estado }).subscribe({
          next: () => this.loadFlujos()
        });
      }
    });
  }

  confirmDelete(flujo: FlujoTrabajo): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar flujo',
        message: `¿Estás seguro de eliminar el flujo "${flujo.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.flujosService.delete(flujo.id).subscribe({
          next: () => this.loadFlujos()
        });
      }
    });
  }
}
