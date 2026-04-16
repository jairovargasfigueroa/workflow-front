import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DepartamentosService } from '../../services/departamentos.service';
import { Departamento } from '../../models/departamento.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { FormularioTemplate } from '../../../formularios/models/formulario.model';

export interface DepartamentoDialogData {
  mode: 'create' | 'edit';
  departamento?: Departamento;
}

@Component({
  selector: 'app-departamento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './departamento-dialog.html',
  styleUrl: './departamento-dialog.scss'
})
export class DepartamentoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DepartamentoDialogComponent>);
  private readonly data = inject<DepartamentoDialogData>(MAT_DIALOG_DATA);
  private readonly departamentosService = inject(DepartamentosService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly notificationService = inject(NotificationService);

  isEditMode = this.data.mode === 'edit';
  saving = false;
  formularios: FormularioTemplate[] = [];

  form = this.fb.nonNullable.group({
    nombre: [this.data.departamento?.nombre || '', [Validators.required, Validators.maxLength(100)]],
    descripcion: [this.data.departamento?.descripcion || '', [Validators.maxLength(500)]],
    formularioId: [this.data.departamento?.formularioId || '']
  });

  get title(): string {
    return this.isEditMode ? 'Editar Departamento' : 'Nuevo Departamento';
  }

  ngOnInit(): void {
    this.formulariosService.getAll().subscribe({
      next: (data) => this.formularios = data.filter(f => f.activo)
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formData = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.departamentosService.update(this.data.departamento!.id, formData)
      : this.departamentosService.create(formData);

    request$.subscribe({
      next: () => {
        this.notificationService.add({
          title: this.isEditMode ? 'Actualizado' : 'Creado',
          message: `Departamento ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
          type: 'success'
        });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
