import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { TramitesService } from '../../services/tramites.service';
import { Tramite } from '../../models/tramite.model';
import { TramiteDialogComponent } from '../../components/tramite-dialog/tramite-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tramites-list',
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
  templateUrl: './tramites-list.html',
  styleUrl: './tramites-list.scss'
})
export class TramitesListComponent implements OnInit {
  private readonly tramitesService = inject(TramitesService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  tramites = signal<Tramite[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'descripcion', 'requisitos', 'activo', 'acciones'];

  ngOnInit(): void {
    this.loadTramites();
  }

  loadTramites(): void {
    this.loading.set(true);
    this.tramitesService.getAll().subscribe({
      next: (data) => {
        this.tramites.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TramiteDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTramites();
      }
    });
  }

  openEditDialog(tramite: Tramite): void {
    const dialogRef = this.dialog.open(TramiteDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { mode: 'edit', tramite }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTramites();
      }
    });
  }

  confirmDelete(tramite: Tramite): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar trámite',
        message: `¿Está seguro que desea eliminar el trámite "${tramite.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteTramite(tramite.id);
      }
    });
  }

  private deleteTramite(id: string): void {
    this.tramitesService.delete(id).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Eliminado',
          message: 'Trámite eliminado correctamente',
          type: 'success'
        });
        this.loadTramites();
      }
    });
  }
}
