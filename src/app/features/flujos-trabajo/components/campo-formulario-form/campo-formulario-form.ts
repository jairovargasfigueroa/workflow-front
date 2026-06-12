import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { CampoFormulario } from '../../../formularios/models/formulario.model';
import { TipoCampo, TIPO_CAMPO_LABELS } from '../../../../core/models';

export interface CampoFormularioFormData {
  campo: CampoFormulario;
  titulo: string;
}

type ListaCampo = 'opciones' | 'columnas' | 'filas';

@Component({
  selector: 'app-campo-formulario-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './campo-formulario-form.html',
  styleUrl: './campo-formulario-form.scss'
})
export class CampoFormularioFormComponent {
  private readonly dialogRef = inject(MatDialogRef<CampoFormularioFormComponent, CampoFormulario | null>);
  private readonly data = inject<CampoFormularioFormData>(MAT_DIALOG_DATA);

  titulo = this.data.titulo;

  // Mismo orden que el form builder de plantillas.
  readonly tiposCampo: { value: TipoCampo; label: string }[] = [
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

  // Trabajamos sobre una copia para no mutar el original hasta confirmar.
  campo: CampoFormulario = this.clonar(this.data.campo);

  private clonar(c: CampoFormulario): CampoFormulario {
    return {
      nombre: c.nombre,
      etiqueta: c.etiqueta,
      tipo: c.tipo,
      requerido: c.requerido,
      opciones: [...(c.opciones ?? [])],
      columnas: [...(c.columnas ?? [])],
      filas: [...(c.filas ?? [])]
    };
  }

  // -------- Condiciones por tipo (igual que el form builder) --------

  get necesitaOpciones(): boolean {
    return ['SELECT', 'RADIO', 'CHECKBOX'].includes(this.campo.tipo);
  }
  get necesitaColumnas(): boolean {
    return ['TABLA', 'GRID'].includes(this.campo.tipo);
  }
  get necesitaFilas(): boolean {
    return this.campo.tipo === 'GRID';
  }
  get labelColumnas(): string {
    return this.campo.tipo === 'GRID' ? 'Opciones del GRID (columnas)' : 'Columnas de la tabla';
  }

  // -------- Chips (opciones / columnas / filas) --------

  lista(campo: ListaCampo): string[] {
    return this.campo[campo] ?? [];
  }

  agregarItem(campo: ListaCampo, event: MatChipInputEvent): void {
    const valor = (event.value || '').trim();
    event.chipInput?.clear();
    if (!valor) return;
    const arr = [...(this.campo[campo] ?? [])];
    if (arr.includes(valor)) return; // sin duplicados
    arr.push(valor);
    this.campo[campo] = arr;
  }

  quitarItem(campo: ListaCampo, item: string): void {
    this.campo[campo] = (this.campo[campo] ?? []).filter(x => x !== item);
  }

  // -------- Validación --------

  get esValido(): boolean {
    const baseOk = this.campo.nombre.trim().length > 0 && this.campo.etiqueta.trim().length > 0;
    if (!baseOk) return false;
    if (this.necesitaOpciones) return (this.campo.opciones?.length ?? 0) > 0;
    if (this.campo.tipo === 'GRID') return (this.campo.filas?.length ?? 0) > 0 && (this.campo.columnas?.length ?? 0) > 0;
    if (this.campo.tipo === 'TABLA') return (this.campo.columnas?.length ?? 0) > 0;
    return true;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (!this.esValido) return;
    const t = this.campo.tipo;
    const usaOpciones = ['SELECT', 'RADIO', 'CHECKBOX'].includes(t);
    const usaColumnas = ['TABLA', 'GRID'].includes(t);
    const limpiar = (arr?: string[]) => (arr ?? []).map(o => o.trim()).filter(o => o);

    // Dejamos solo la config relevante al tipo.
    const resultado: CampoFormulario = {
      nombre: this.campo.nombre.trim(),
      etiqueta: this.campo.etiqueta.trim(),
      tipo: t,
      requerido: this.campo.requerido,
      opciones: usaOpciones && this.lista('opciones').length ? limpiar(this.campo.opciones) : undefined,
      columnas: usaColumnas && this.lista('columnas').length ? limpiar(this.campo.columnas) : undefined,
      filas: t === 'GRID' && this.lista('filas').length ? limpiar(this.campo.filas) : undefined
    };
    this.dialogRef.close(resultado);
  }
}
