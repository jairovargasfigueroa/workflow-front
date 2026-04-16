import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DepartamentosService } from '../../services/departamentos.service';
import { Departamento } from '../../models/departamento.model';
import { DepartamentoDialogComponent } from '../../components/departamento-dialog/departamento-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-departamentos-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  templateUrl: './departamentos-list.html',
  styleUrl: './departamentos-list.scss'
})
export class DepartamentosListComponent implements OnInit {
  private readonly departamentosService = inject(DepartamentosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  departamentos = signal<Departamento[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'descripcion', 'estado', 'fechaCreacion', 'acciones'];

  ngOnInit(): void {
    this.loadDepartamentos();
  }

  loadDepartamentos(): void {
    this.loading.set(true);
    this.departamentosService.getAll().subscribe({
      next: (data) => {
        this.departamentos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DepartamentoDialogComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDepartamentos();
      }
    });
  }

  openEditDialog(departamento: Departamento): void {
    const dialogRef = this.dialog.open(DepartamentoDialogComponent, {
      width: '500px',
      data: { mode: 'edit', departamento }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDepartamentos();
      }
    });
  }

  confirmDelete(departamento: Departamento): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar departamento',
        message: `¿Está seguro que desea eliminar el departamento "${departamento.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteDepartamento(departamento.id);
      }
    });
  }

  private deleteDepartamento(id: string): void {
    this.departamentosService.delete(id).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Eliminado',
          message: 'Departamento eliminado correctamente',
          type: 'success'
        });
        this.loadDepartamentos();
      }
    });
  }
}
