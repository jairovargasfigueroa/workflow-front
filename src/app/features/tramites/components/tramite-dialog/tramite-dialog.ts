import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { TramitesService } from '../../services/tramites.service';
import { Tramite } from '../../models/tramite.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { FormularioTemplate } from '../../../formularios/models/formulario.model';
import { FlujosTrabajoService } from '../../../flujos-trabajo/services/flujos-trabajo.service';
import { FlujoTrabajo } from '../../../flujos-trabajo/models/flujo-trabajo.model';

export interface TramiteDialogData {
  mode: 'create' | 'edit';
  tramite?: Tramite;
}

@Component({
  selector: 'app-tramite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './tramite-dialog.html',
  styleUrl: './tramite-dialog.scss'
})
export class TramiteDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TramiteDialogComponent>);
  private readonly data = inject<TramiteDialogData>(MAT_DIALOG_DATA);
  private readonly tramitesService = inject(TramitesService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly flujosTrabajoService = inject(FlujosTrabajoService);
  private readonly notificationService = inject(NotificationService);

  isEditMode = this.data.mode === 'edit';
  saving = false;
  formularios: FormularioTemplate[] = [];
  flujos: FlujoTrabajo[] = [];

  form = this.fb.nonNullable.group({
    nombre: [this.data.tramite?.nombre || '', [Validators.required, Validators.maxLength(200)]],
    descripcion: [this.data.tramite?.descripcion || ''],
    formularioSolicitanteId: [this.data.tramite?.formularioSolicitanteId || ''],
    flujoTrabajoId: [this.data.tramite?.flujoTrabajoId || ''],
    requisitos: this.fb.array<string>([])
  });

  get requisitosArray(): FormArray {
    return this.form.controls.requisitos;
  }

  get title(): string {
    return this.isEditMode ? 'Editar Trámite' : 'Nuevo Trámite';
  }

  ngOnInit(): void {
    this.formulariosService.getAll().subscribe({
      next: (data) => this.formularios = data.filter(f => f.activo)
    });

    this.flujosTrabajoService.getAll().subscribe({
      next: (data) => this.flujos = data.filter(f => f.activo)
    });

    if (this.isEditMode && this.data.tramite?.requisitos) {
      this.data.tramite.requisitos.forEach(req => {
        this.requisitosArray.push(this.fb.control(req, Validators.required));
      });
    }
  }

  addRequisito(): void {
    this.requisitosArray.push(this.fb.control('', Validators.required));
  }

  removeRequisito(index: number): void {
    this.requisitosArray.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    const requestData = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      formularioSolicitanteId: formValue.formularioSolicitanteId || undefined,
      flujoTrabajoId: formValue.flujoTrabajoId || undefined,
      requisitos: formValue.requisitos.filter((r): r is string => r != null && r.trim() !== '')
    };

    const request$ = this.isEditMode
      ? this.tramitesService.update(this.data.tramite!.id, requestData)
      : this.tramitesService.create(requestData);

    request$.subscribe({
      next: () => {
        this.notificationService.add({
          title: this.isEditMode ? 'Actualizado' : 'Creado',
          message: `Trámite ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
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
