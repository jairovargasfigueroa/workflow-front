import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { FormulariosService } from '../../services/formularios.service';
import { FormularioTemplate, CampoFormulario } from '../../models/formulario.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { TipoCampo, TIPO_CAMPO_LABELS } from '../../../../core/models';

export interface FormularioDialogData {
  mode: 'create' | 'edit';
  formulario?: FormularioTemplate;
}

@Component({
  selector: 'app-formulario-dialog',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DragDropModule
  ],
  templateUrl: './formulario-dialog.html',
  styleUrl: './formulario-dialog.scss'
})
export class FormularioDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FormularioDialogComponent>);
  private readonly data = inject<FormularioDialogData>(MAT_DIALOG_DATA);
  private readonly formulariosService = inject(FormulariosService);
  private readonly notificationService = inject(NotificationService);

  isEditMode = this.data.mode === 'edit';
  saving = false;

  tiposCampo: { value: TipoCampo; label: string }[] = [
    { value: 'TEXT', label: TIPO_CAMPO_LABELS.TEXT },
    { value: 'NUMBER', label: TIPO_CAMPO_LABELS.NUMBER },
    { value: 'DATE', label: TIPO_CAMPO_LABELS.DATE },
    { value: 'SELECT', label: TIPO_CAMPO_LABELS.SELECT },
    { value: 'FILE', label: TIPO_CAMPO_LABELS.FILE },
    { value: 'TEXTAREA', label: TIPO_CAMPO_LABELS.TEXTAREA }
  ];

  form = this.fb.nonNullable.group({
    titulo: [this.data.formulario?.titulo || '', [Validators.required, Validators.maxLength(100)]],
    descripcion: [this.data.formulario?.descripcion || ''],
    campos: this.fb.array<ReturnType<typeof this.createCampoGroup>>([])
  });

  get camposArray(): FormArray {
    return this.form.controls.campos;
  }

  readonly title = this.isEditMode ? 'Editar Formulario' : 'Nuevo Formulario';

  ngOnInit(): void {
    if (this.isEditMode && this.data.formulario?.campos) {
      this.data.formulario.campos.forEach(campo => {
        this.camposArray.push(this.createCampoGroup(campo));
      });
    }
  }

  createCampoGroup(campo?: CampoFormulario) {
    return this.fb.nonNullable.group({
      nombre: [campo?.nombre || '', [Validators.required]],
      etiqueta: [campo?.etiqueta || '', [Validators.required]],
      tipo: [campo?.tipo || 'TEXT' as TipoCampo, [Validators.required]],
      requerido: [campo?.requerido ?? false],
      opciones: [campo?.opciones?.join(', ') || '']
    });
  }

  addCampo(): void {
    this.camposArray.push(this.createCampoGroup());
  }

  removeCampo(index: number): void {
    this.camposArray.removeAt(index);
  }

  dropCampo(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.camposArray.controls, event.previousIndex, event.currentIndex);
  }

  isTipoSelect(index: number): boolean {
    return this.camposArray.at(index).get('tipo')?.value === 'SELECT';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    const campos: CampoFormulario[] = formValue.campos.map(c => ({
      nombre: c.nombre,
      etiqueta: c.etiqueta,
      tipo: c.tipo,
      requerido: c.requerido,
      opciones: c.tipo === 'SELECT' && c.opciones
        ? c.opciones.split(',').map(o => o.trim()).filter(o => o)
        : undefined
    }));

    const request$ = this.isEditMode
      ? this.formulariosService.update(this.data.formulario!.id, { titulo: formValue.titulo, descripcion: formValue.descripcion, campos })
      : this.formulariosService.create({ titulo: formValue.titulo, descripcion: formValue.descripcion, campos });

    try {
      await firstValueFrom(request$);
      this.notificationService.add({
        title: this.isEditMode ? 'Actualizado' : 'Creado',
        message: `Formulario ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
        type: 'success'
      });
      this.dialogRef.close(true);
    } catch {
      this.saving = false;
    }
  }
}
