import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { FormulariosService } from '../../services/formularios.service';
import { FormularioTemplate } from '../../models/formulario.model';
import { FormularioDialogComponent } from '../../components/formulario-dialog/formulario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { ListSkeletonComponent } from '../../../../shared/components/ui/list-skeleton/list-skeleton';
import { FeedbackService } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-formularios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    EmptyStateComponent,
    PageHeaderComponent,
    ListSkeletonComponent
  ],
  templateUrl: './formularios-list.html',
  styleUrl: './formularios-list.scss'
})
export class FormulariosListComponent implements OnInit {
  private readonly formulariosService = inject(FormulariosService);
  private readonly dialog = inject(MatDialog);
  private readonly feedback = inject(FeedbackService);

  formularios = signal<FormularioTemplate[]>([]);
  loading = signal(true);
  displayedColumns = ['titulo', 'descripcion', 'campos', 'activo', 'acciones'];

  ngOnInit(): void {
    this.loadFormularios();
  }

  private loadFormularios(): void {
    this.loading.set(true);
    this.formulariosService.getAll().subscribe({
      next: (data) => {
        this.formularios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openDialog(formulario?: FormularioTemplate): void {
    const dialogRef = this.dialog.open(FormularioDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: formulario ? { mode: 'edit', formulario } : { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFormularios();
      }
    });
  }

  confirmDelete(formulario: FormularioTemplate): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar formulario',
        message: `¿Está seguro que desea eliminar el formulario "${formulario.titulo}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteFormulario(formulario.id);
      }
    });
  }

  private deleteFormulario(id: string): void {
    this.formulariosService.delete(id).subscribe({
      next: () => {
        this.feedback.success('Formulario eliminado correctamente');
        this.loadFormularios();
      },
      error: () => {
        this.loadFormularios();
      }
    });
  }
}
