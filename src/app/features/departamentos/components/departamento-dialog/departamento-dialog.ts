import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DepartamentosService } from '../../services/departamentos.service';
import { Departamento } from '../../models/departamento.model';
import { FeedbackService } from '../../../../core/services/feedback.service';

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
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './departamento-dialog.html',
  styleUrl: './departamento-dialog.scss'
})
export class DepartamentoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DepartamentoDialogComponent>);
  private readonly data = inject<DepartamentoDialogData>(MAT_DIALOG_DATA);
  private readonly departamentosService = inject(DepartamentosService);
  private readonly feedback = inject(FeedbackService);

  isEditMode = this.data.mode === 'edit';
  saving = false;

  form = this.fb.nonNullable.group({
    nombre: [this.data.departamento?.nombre || '', [Validators.required, Validators.maxLength(100)]]
  });

  readonly title = this.isEditMode ? 'Editar Departamento' : 'Nuevo Departamento';

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formData = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.departamentosService.update(this.data.departamento!.id, formData)
      : this.departamentosService.create(formData);

    try {
      await firstValueFrom(request$);
      this.feedback.success(`Departamento ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`);
      this.dialogRef.close(true);
    } catch {
      this.saving = false;
    }
  }
}
