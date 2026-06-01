import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import {
  SujetoPermiso,
  TIPO_SUJETO_PERMISO_DESCRIPCIONES,
  TIPO_SUJETO_PERMISO_LABELS,
  TipoSujetoPermiso,
  sujetoRequiereId
} from '../../models/configuracion-documental.model';
import { Rol, ROL_LABELS } from '../../../../core/models';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Departamento } from '../../../departamentos/models/departamento.model';

export interface SujetoPermisoSelectorData {
  existentes?: SujetoPermiso[];
}

@Component({
  selector: 'app-sujeto-permiso-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './sujeto-permiso-selector.html',
  styleUrl: './sujeto-permiso-selector.scss'
})
export class SujetoPermisoSelectorComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SujetoPermisoSelectorComponent, SujetoPermiso | null>);
  private readonly data = inject<SujetoPermisoSelectorData>(MAT_DIALOG_DATA);
  private readonly departamentosService = inject(DepartamentosService);

  readonly tipoLabels = TIPO_SUJETO_PERMISO_LABELS;
  readonly tipoDescripciones = TIPO_SUJETO_PERMISO_DESCRIPCIONES;
  readonly roles: Rol[] = ['ADMIN', 'FUNCIONARIO', 'SOLICITANTE'];
  readonly rolLabels = ROL_LABELS;

  readonly tipos: TipoSujetoPermiso[] = [
    'ROL',
    'DEPARTAMENTO',
    'DPTO_ORIGEN',
    'QUIEN_LO_SUBIO',
    'DUENO_TRAMITE',
    'TODOS_SIGUIENTES_NODOS',
    'TODOS_AUTENTICADOS'
  ];

  departamentos = signal<Departamento[]>([]);
  tipoSeleccionado: TipoSujetoPermiso = 'ROL';
  sujetoId: string | null = null;

  ngOnInit(): void {
    this.departamentosService.getAll().subscribe({
      next: deps => this.departamentos.set(deps),
      error: () => {}
    });
  }

  requiereId(tipo: TipoSujetoPermiso): boolean {
    return sujetoRequiereId(tipo);
  }

  onTipoChange(tipo: TipoSujetoPermiso): void {
    this.tipoSeleccionado = tipo;
    this.sujetoId = null;
  }

  yaExiste(): boolean {
    const existentes = this.data.existentes ?? [];
    return existentes.some(s =>
      s.tipo === this.tipoSeleccionado && s.sujetoId === this.sujetoId
    );
  }

  get puedeAgregar(): boolean {
    if (this.yaExiste()) return false;
    if (this.requiereId(this.tipoSeleccionado)) {
      return !!this.sujetoId;
    }
    return true;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onAdd(): void {
    if (!this.puedeAgregar) return;
    this.dialogRef.close({
      tipo: this.tipoSeleccionado,
      sujetoId: this.requiereId(this.tipoSeleccionado) ? this.sujetoId : null
    });
  }
}
