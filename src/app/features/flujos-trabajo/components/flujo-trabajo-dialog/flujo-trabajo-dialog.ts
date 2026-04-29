import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import { FlujoTrabajo } from '../../models/flujo-trabajo.model';

export interface FlujoTrabajoDialogData {
  mode: 'create' | 'edit';
  flujo?: FlujoTrabajo;
}

@Component({
  selector: 'app-flujo-trabajo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './flujo-trabajo-dialog.html',
  styleUrl: './flujo-trabajo-dialog.scss'
})
export class FlujoTrabajoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FlujoTrabajoDialogComponent>);
  private readonly data = inject<FlujoTrabajoDialogData>(MAT_DIALOG_DATA);
  private readonly flujosService = inject(FlujosTrabajoService);

  isEditMode = this.data.mode === 'edit';
  saving = false;

  form = this.fb.nonNullable.group({
    nombre: [this.data.flujo?.nombre || '', [Validators.required, Validators.maxLength(100)]],
    descripcion: [this.data.flujo?.descripcion || '', Validators.maxLength(500)]
  });

  get title(): string {
    return this.isEditMode ? 'Editar Flujo de Trabajo' : 'Nuevo Flujo de Trabajo';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.flujosService.update(this.data.flujo!.id, formValue)
      : this.flujosService.create(formValue);

    request$.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error:', error);
        this.saving = false;
      }
    });
  }

}
