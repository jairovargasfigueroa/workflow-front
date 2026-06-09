import { Component, OnInit, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormArray, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { TramitesService } from '../../services/tramites.service';
import { Tramite } from '../../models/tramite.model';
import { Criticidad, CRITICIDAD_LABELS } from '../../../../core/models/sla';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { FormularioTemplate } from '../../../formularios/models/formulario.model';
import { FlujosTrabajoService } from '../../../flujos-trabajo/services/flujos-trabajo.service';
import { FlujoTrabajo } from '../../../flujos-trabajo/models/flujo-trabajo.model';

export interface TramiteDialogData {
  mode: 'create' | 'edit';
  tramite?: Tramite;
}

const ETIQUETAS_RECOMENDADAS_MIN = 8;
const ETIQUETAS_ADVERTENCIA_MAX = 20;

const CRITICIDADES: Criticidad[] = ['RUTINARIO', 'IMPORTANTE', 'CRITICO', 'EMERGENCIA'];

/** Valida que plazoMaximoHoras >= plazoObjetivoHoras cuando ambos están presentes. */
const plazoCoherenteValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const objetivo = group.get('plazoObjetivoHoras')?.value;
  const maximo = group.get('plazoMaximoHoras')?.value;
  if (objetivo != null && maximo != null && Number(maximo) < Number(objetivo)) {
    return { plazoIncoherente: true };
  }
  return null;
};

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
    MatDividerModule,
    MatChipsModule
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

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly maxRecomendado = ETIQUETAS_ADVERTENCIA_MAX;
  readonly minRecomendado = ETIQUETAS_RECOMENDADAS_MIN;
  readonly criticidades = CRITICIDADES;
  readonly criticidadLabels = CRITICIDAD_LABELS;

  isEditMode = this.data.mode === 'edit';
  saving = false;
  formularios: FormularioTemplate[] = [];
  flujos: FlujoTrabajo[] = [];

  etiquetas: string[] = [];

  form = this.fb.group({
    nombre: this.fb.control(this.data.tramite?.nombre || '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    descripcion: this.fb.control(this.data.tramite?.descripcion || '', { nonNullable: true }),
    formularioSolicitanteId: this.fb.control(this.data.tramite?.formularioSolicitanteId || '', { nonNullable: true }),
    flujoTrabajoId: this.fb.control(this.data.tramite?.flujoTrabajoId || '', { nonNullable: true }),
    requisitos: this.fb.array<string>([]),
    plazoObjetivoHoras: this.fb.control<number | null>(this.data.tramite?.plazoObjetivoHoras ?? null, { validators: [Validators.min(1)] }),
    plazoMaximoHoras: this.fb.control<number | null>(this.data.tramite?.plazoMaximoHoras ?? null, { validators: [Validators.min(1)] }),
    umbralAlertaPorcentaje: this.fb.control<number | null>(this.data.tramite?.umbralAlertaPorcentaje ?? null, { validators: [Validators.min(1), Validators.max(100)] }),
    criticidad: this.fb.control<Criticidad | null>(this.data.tramite?.criticidad ?? null)
  }, { validators: plazoCoherenteValidator });

  get requisitosArray(): FormArray {
    return this.form.controls.requisitos;
  }

  readonly title = this.isEditMode ? 'Editar Trámite' : 'Nuevo Trámite';

  ngOnInit(): void {
    this.formulariosService.getAll().subscribe({
      next: (data) => this.formularios = data.filter(f => f.activo)
    });

    this.flujosTrabajoService.getAll().subscribe({
      next: (data) => this.flujos = data.filter(f => f.estadoFlujo === 'ACTIVO')
    });

    if (this.isEditMode && this.data.tramite?.requisitos) {
      this.data.tramite.requisitos.forEach(req => {
        this.requisitosArray.push(this.fb.control(req, Validators.required));
      });
    }

    // Cargar etiquetas existentes (puede venir null/undefined en trámites viejos).
    this.etiquetas = [...(this.data.tramite?.etiquetas ?? [])];
  }

  addRequisito(): void {
    this.requisitosArray.push(this.fb.control('', Validators.required));
  }

  removeRequisito(index: number): void {
    this.requisitosArray.removeAt(index);
  }

  agregarEtiqueta(event: MatChipInputEvent): void {
    const raw = (event.value || '').trim().toLowerCase();
    event.chipInput?.clear();
    if (!raw) return;
    if (this.etiquetas.includes(raw)) return; // sin duplicados
    this.etiquetas = [...this.etiquetas, raw];
  }

  quitarEtiqueta(etiqueta: string): void {
    this.etiquetas = this.etiquetas.filter(e => e !== etiqueta);
  }

  get superaMaxRecomendado(): boolean {
    return this.etiquetas.length > ETIQUETAS_ADVERTENCIA_MAX;
  }

  get pocoEtiquetado(): boolean {
    return this.etiquetas.length > 0 && this.etiquetas.length < ETIQUETAS_RECOMENDADAS_MIN;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    const requestData = {
      nombre: formValue.nombre!,
      descripcion: formValue.descripcion,
      formularioSolicitanteId: formValue.formularioSolicitanteId || undefined,
      flujoTrabajoId: formValue.flujoTrabajoId || undefined,
      requisitos: (formValue.requisitos ?? []).filter((r): r is string => r != null && r.trim() !== ''),
      etiquetas: this.etiquetas,
      plazoObjetivoHoras: formValue.plazoObjetivoHoras ?? null,
      plazoMaximoHoras: formValue.plazoMaximoHoras ?? null,
      umbralAlertaPorcentaje: formValue.umbralAlertaPorcentaje ?? null,
      criticidad: formValue.criticidad ?? null
    };

    const request$ = this.isEditMode
      ? this.tramitesService.update(this.data.tramite!.id, requestData)
      : this.tramitesService.create(requestData);

    try {
      await firstValueFrom(request$);
      this.notificationService.add({
        title: this.isEditMode ? 'Actualizado' : 'Creado',
        message: `Trámite ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
        type: 'success'
      });
      this.dialogRef.close(true);
    } catch {
      this.saving = false;
    }
  }
}
