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
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { FormulariosService } from '../../services/formularios.service';
import { FormularioTemplate, CampoFormulario } from '../../models/formulario.model';
import { FeedbackService } from '../../../../core/services/feedback.service';
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
    MatChipsModule,
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
  private readonly feedback = inject(FeedbackService);

  isEditMode = this.data.mode === 'edit';
  saving = false;

  tiposCampo: { value: TipoCampo; label: string }[] = [
    { value: 'TEXT', label: TIPO_CAMPO_LABELS.TEXT },
    { value: 'NUMBER', label: TIPO_CAMPO_LABELS.NUMBER },
    { value: 'DATE', label: TIPO_CAMPO_LABELS.DATE },
    { value: 'EMAIL', label: TIPO_CAMPO_LABELS.EMAIL },
    { value: 'PHONE', label: TIPO_CAMPO_LABELS.PHONE },
    { value: 'TEXTAREA', label: TIPO_CAMPO_LABELS.TEXTAREA },
    { value: 'BOOLEAN', label: TIPO_CAMPO_LABELS.BOOLEAN },
    { value: 'SELECT', label: TIPO_CAMPO_LABELS.SELECT },
    { value: 'RADIO', label: TIPO_CAMPO_LABELS.RADIO },
    { value: 'CHECKBOX', label: TIPO_CAMPO_LABELS.CHECKBOX },
    { value: 'TABLA', label: TIPO_CAMPO_LABELS.TABLA },
    { value: 'GRID', label: TIPO_CAMPO_LABELS.GRID },
    { value: 'FILE', label: TIPO_CAMPO_LABELS.FILE }
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
      // opciones/columnas/filas ahora son arrays (se editan con chips)
      opciones: [campo?.opciones ?? ([] as string[])],
      columnas: [campo?.columnas ?? ([] as string[])],
      filas: [campo?.filas ?? ([] as string[])]
    });
  }

  // ---- Chips para listas (opciones / columnas / filas) ----

  lista(index: number, campo: 'opciones' | 'columnas' | 'filas'): string[] {
    return (this.camposArray.at(index).get(campo)?.value ?? []) as string[];
  }

  agregarItem(index: number, campo: 'opciones' | 'columnas' | 'filas', event: MatChipInputEvent): void {
    const valor = (event.value || '').trim();
    event.chipInput?.clear();
    if (!valor) return;
    const ctrl = this.camposArray.at(index).get(campo);
    const arr = [...((ctrl?.value ?? []) as string[])];
    if (arr.includes(valor)) return; // sin duplicados
    arr.push(valor);
    ctrl?.setValue(arr);
  }

  quitarItem(index: number, campo: 'opciones' | 'columnas' | 'filas', item: string): void {
    const ctrl = this.camposArray.at(index).get(campo);
    const arr = ((ctrl?.value ?? []) as string[]).filter(x => x !== item);
    ctrl?.setValue(arr);
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

  private tipoDe(index: number): TipoCampo {
    return this.camposArray.at(index).get('tipo')?.value as TipoCampo;
  }

  /** Opciones a elegir: SELECT, RADIO, CHECKBOX. */
  necesitaOpciones(index: number): boolean {
    return ['SELECT', 'RADIO', 'CHECKBOX'].includes(this.tipoDe(index));
  }

  /** Columnas: TABLA (columnas de la tabla) y GRID (opciones por fila). */
  necesitaColumnas(index: number): boolean {
    return ['TABLA', 'GRID'].includes(this.tipoDe(index));
  }

  /** Filas: solo GRID. */
  necesitaFilas(index: number): boolean {
    return this.tipoDe(index) === 'GRID';
  }

  /** Etiqueta del campo "columnas" según el tipo (en GRID son las opciones). */
  labelColumnas(index: number): string {
    return this.tipoDe(index) === 'GRID' ? 'Opciones del GRID (columnas)' : 'Columnas de la tabla';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    const usaOpciones = (t: TipoCampo) => ['SELECT', 'RADIO', 'CHECKBOX'].includes(t);
    const usaColumnas = (t: TipoCampo) => ['TABLA', 'GRID'].includes(t);
    const limpiar = (arr: string[]) => arr.map(o => o.trim()).filter(o => o);

    const campos: CampoFormulario[] = formValue.campos.map(c => ({
      nombre: c.nombre,
      etiqueta: c.etiqueta,
      tipo: c.tipo,
      requerido: c.requerido,
      opciones: usaOpciones(c.tipo) && c.opciones?.length ? limpiar(c.opciones) : undefined,
      columnas: usaColumnas(c.tipo) && c.columnas?.length ? limpiar(c.columnas) : undefined,
      filas: c.tipo === 'GRID' && c.filas?.length ? limpiar(c.filas) : undefined
    }));

    const request$ = this.isEditMode
      ? this.formulariosService.update(this.data.formulario!.id, { titulo: formValue.titulo, descripcion: formValue.descripcion, campos })
      : this.formulariosService.create({ titulo: formValue.titulo, descripcion: formValue.descripcion, campos });

    try {
      await firstValueFrom(request$);
      this.feedback.success(`Formulario ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`);
      this.dialogRef.close(true);
    } catch {
      this.saving = false;
    }
  }
}
