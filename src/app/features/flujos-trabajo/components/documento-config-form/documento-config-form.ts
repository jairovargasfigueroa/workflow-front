import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';

import {
  DocumentoConfig,
  PermisoSet,
  SujetoPermiso,
  TIPO_SUJETO_PERMISO_LABELS,
  emptyPermisoSet
} from '../../models/configuracion-documental.model';
import { ROL_LABELS, Rol } from '../../../../core/models';
import {
  SujetoPermisoSelectorComponent
} from '../sujeto-permiso-selector/sujeto-permiso-selector';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Departamento } from '../../../departamentos/models/departamento.model';

export type ListaPermiso = 'lectores' | 'editores' | 'eliminadores';

export interface DocumentoConfigFormData {
  documento: DocumentoConfig;
  titulo: string;
  camposFormularioDisponibles?: string[];
}

const FORMATOS_DISPONIBLES = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'txt', 'csv', 'zip'];

@Component({
  selector: 'app-documento-config-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './documento-config-form.html',
  styleUrl: './documento-config-form.scss'
})
export class DocumentoConfigFormComponent {
  private readonly dialogRef = inject(MatDialogRef<DocumentoConfigFormComponent, DocumentoConfig | null>);
  private readonly data = inject<DocumentoConfigFormData>(MAT_DIALOG_DATA);
  private readonly matDialog = inject(MatDialog);
  private readonly departamentosService = inject(DepartamentosService);

  readonly formatosDisponibles = FORMATOS_DISPONIBLES;
  readonly tipoLabels = TIPO_SUJETO_PERMISO_LABELS;
  readonly rolLabels = ROL_LABELS;

  titulo = this.data.titulo;
  camposFormularioDisponibles = this.data.camposFormularioDisponibles ?? [];

  // Trabajamos sobre una copia para no mutar el original hasta confirmar
  documento: DocumentoConfig = this.clonar(this.data.documento);

  private departamentosCache: Departamento[] = [];

  constructor() {
    this.departamentosService.getAll().subscribe({
      next: deps => (this.departamentosCache = deps),
      error: () => {}
    });
  }

  private clonar(d: DocumentoConfig): DocumentoConfig {
    return {
      nombre: d.nombre,
      campoFormularioAsociado: d.campoFormularioAsociado,
      formatosAceptados: [...d.formatosAceptados],
      obligatorio: d.obligatorio,
      inmutablePostCierre: d.inmutablePostCierre,
      permisos: {
        lectores: [...(d.permisos?.lectores ?? [])],
        editores: [...(d.permisos?.editores ?? [])],
        eliminadores: [...(d.permisos?.eliminadores ?? [])]
      }
    };
  }

  get permisos(): PermisoSet {
    if (!this.documento.permisos) this.documento.permisos = emptyPermisoSet();
    return this.documento.permisos;
  }

  get esValido(): boolean {
    return this.documento.nombre.trim().length > 0;
  }

  async agregarSujeto(lista: ListaPermiso): Promise<void> {
    const existentes = this.permisos[lista];
    const ref = this.matDialog.open(SujetoPermisoSelectorComponent, {
      data: { existentes },
      width: '500px'
    });
    const nuevo = (await firstValueFrom(ref.afterClosed())) as SujetoPermiso | null;
    if (nuevo) {
      this.permisos[lista] = [...existentes, nuevo];
    }
  }

  quitarSujeto(lista: ListaPermiso, index: number): void {
    const nueva = [...this.permisos[lista]];
    nueva.splice(index, 1);
    this.permisos[lista] = nueva;
  }

  describirSujeto(s: SujetoPermiso): string {
    const base = this.tipoLabels[s.tipo];
    if (s.tipo === 'ROL' && s.sujetoId) {
      const rol = s.sujetoId as Rol;
      return `${base}: ${this.rolLabels[rol] ?? s.sujetoId}`;
    }
    if (s.tipo === 'DEPARTAMENTO' && s.sujetoId) {
      const dep = this.departamentosCache.find(d => d.id === s.sujetoId);
      return `${base}: ${dep?.nombre ?? s.sujetoId}`;
    }
    return base;
  }

  toggleFormato(formato: string, checked: boolean): void {
    if (checked) {
      if (!this.documento.formatosAceptados.includes(formato)) {
        this.documento.formatosAceptados = [...this.documento.formatosAceptados, formato];
      }
    } else {
      this.documento.formatosAceptados = this.documento.formatosAceptados.filter(f => f !== formato);
    }
  }

  formatoSeleccionado(formato: string): boolean {
    return this.documento.formatosAceptados.includes(formato);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (!this.esValido) return;
    this.documento.nombre = this.documento.nombre.trim();
    if (this.documento.campoFormularioAsociado) {
      this.documento.campoFormularioAsociado = this.documento.campoFormularioAsociado.trim() || null;
    }
    this.dialogRef.close(this.documento);
  }
}
