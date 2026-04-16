import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import { FlujoTrabajo } from '../../models/flujo-trabajo.model';
import { FlujoTrabajoDialogComponent } from '../../components/flujo-trabajo-dialog/flujo-trabajo-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';

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
    MatChipsModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  templateUrl: './flujos-trabajo-list.html',
  styleUrl: './flujos-trabajo-list.scss'
})
export class FlujosTrabajoListComponent implements OnInit {
  private readonly flujosService = inject(FlujosTrabajoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  flujos = signal<FlujoTrabajo[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'procesoKey', 'activo', 'acciones'];

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

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FlujoTrabajoDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFlujos();
      }
    });
  }

  openEditDialog(flujo: FlujoTrabajo): void {
    const dialogRef = this.dialog.open(FlujoTrabajoDialogComponent, {
      width: '600px',
      data: { mode: 'edit', flujo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFlujos();
      }
    });
  }

  openEditor(flujo: FlujoTrabajo): void {
    this.router.navigate(['/flujos-trabajo', flujo.id, 'editor']);
  }

  confirmDelete(flujo: FlujoTrabajo): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Flujo',
        message: `¿Estás seguro de eliminar el flujo "${flujo.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteFlujo(flujo.id);
      }
    });
  }

  private deleteFlujo(id: string): void {
    this.flujosService.delete(id).subscribe({
      next: () => {
        this.loadFlujos();
      },
      error: (error) => {
        console.error('Error al eliminar flujo:', error);
      }
    });
  }
}
