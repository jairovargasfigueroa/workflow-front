import { Component, OnChanges, SimpleChanges, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  ConfiguracionDocumental,
  DocumentoConfig,
  PermisoSet,
  SujetoPermiso,
  TIPO_SUJETO_PERMISO_LABELS,
  emptyConfiguracionDocumental,
  emptyDocumentoConfig
} from '../../models/configuracion-documental.model';
import {
  escribirConfiguracionDocumental,
  leerConfiguracionDocumental
} from '../../services/configuracion-documental-bpmn.helper';
import {
  DocumentoConfigFormComponent,
  ListaPermiso
} from '../documento-config-form/documento-config-form';
import {
  SujetoPermisoSelectorComponent
} from '../sujeto-permiso-selector/sujeto-permiso-selector';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { ROL_LABELS, Rol } from '../../../../core/models';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Departamento } from '../../../departamentos/models/departamento.model';

@Component({
  selector: 'app-nodo-config-documental',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './nodo-config-documental.html',
  styleUrl: './nodo-config-documental.scss'
})
export class NodoConfigDocumentalComponent implements OnChanges {
  modeler = input<any>(null);
  element = input<any>(null);
  /** 'tarea' (UserTask del funcionario) o 'inicio' (StartEvent del solicitante). */
  contexto = input<'tarea' | 'inicio'>('tarea');
  /** Si true, renderiza el contenido sin su propio mat-expansion-panel
   *  (para anidar dentro de un acordeón externo, p. ej. el panel de propiedades). */
  embebido = input<boolean>(false);

  private readonly matDialog = inject(MatDialog);
  private readonly departamentosService = inject(DepartamentosService);

  readonly tipoLabels = TIPO_SUJETO_PERMISO_LABELS;
  readonly rolLabels = ROL_LABELS;

  config: ConfiguracionDocumental = emptyConfiguracionDocumental();
  private departamentosCache: Departamento[] = [];

  // Textos adaptados al contexto (tarea / inicio).
  get tituloSeccion(): string {
    return this.contexto() === 'inicio'
      ? 'Documentos del kit del solicitante'
      : 'Documentos producidos (output)';
  }
  get resumenHeader(): string {
    const n = this.config.documentosProducidos.length;
    return this.contexto() === 'inicio'
      ? `${n} documentos del kit`
      : `${n} documentos producidos`;
  }
  get emptyText(): string {
    return this.contexto() === 'inicio'
      ? 'Este trámite no requiere documentos del solicitante.'
      : 'Este nodo no produce documentos declarados.';
  }
  get adHocDesc(): string {
    return this.contexto() === 'inicio'
      ? 'Se aplican cuando el solicitante adjunta un archivo extra al crear el trámite.'
      : 'Se aplican cuando alguien sube un archivo extra en este nodo, sin asociarlo a un documento declarado.';
  }

  constructor() {
    this.departamentosService.getAll().subscribe({
      next: deps => (this.departamentosCache = deps),
      error: () => {}
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['element']) {
      this.recargarDesdeElement();
    }
  }

  private recargarDesdeElement(): void {
    const el = this.element();
    if (!el) {
      this.config = emptyConfiguracionDocumental();
      return;
    }
    const leida = leerConfiguracionDocumental(el);
    this.config = leida ?? emptyConfiguracionDocumental();
  }

  private persistir(): void {
    escribirConfiguracionDocumental(this.modeler(), this.element(), this.config);
  }

  // -------- Documentos producidos --------

  async agregarDocumento(): Promise<void> {
    const titulo = this.contexto() === 'inicio'
      ? 'Nuevo documento del kit'
      : 'Nuevo documento producido';
    const ref = this.matDialog.open(DocumentoConfigFormComponent, {
      data: {
        documento: emptyDocumentoConfig(),
        titulo
      },
      width: '660px',
      maxHeight: '88vh'
    });
    const result = (await firstValueFrom(ref.afterClosed())) as DocumentoConfig | null;
    if (!result) return;
    this.config.documentosProducidos = [...this.config.documentosProducidos, result];
    this.persistir();
  }

  async editarDocumento(index: number): Promise<void> {
    const original = this.config.documentosProducidos[index];
    const titulo = `Editar documento — ${original.nombre}`;
    const ref = this.matDialog.open(DocumentoConfigFormComponent, {
      data: {
        documento: original,
        titulo
      },
      width: '660px',
      maxHeight: '88vh'
    });
    const result = (await firstValueFrom(ref.afterClosed())) as DocumentoConfig | null;
    if (!result) return;
    const nueva = [...this.config.documentosProducidos];
    nueva[index] = result;
    this.config.documentosProducidos = nueva;
    this.persistir();
  }

  async quitarDocumento(index: number): Promise<void> {
    const doc = this.config.documentosProducidos[index];
    const confirmado = await firstValueFrom(
      this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Quitar documento?',
          message: `Se eliminará "${doc.nombre}" de la configuración del nodo.`,
          confirmText: 'Quitar',
          cancelText: 'Cancelar',
          confirmColor: 'warn'
        }
      }).afterClosed()
    );
    if (!confirmado) return;
    const nueva = [...this.config.documentosProducidos];
    nueva.splice(index, 1);
    this.config.documentosProducidos = nueva;
    this.persistir();
  }

  // -------- Permisos default ad-hoc --------

  async agregarSujetoAdHoc(lista: ListaPermiso): Promise<void> {
    const existentes = this.config.permisosDefaultAdHoc[lista];
    const ref = this.matDialog.open(SujetoPermisoSelectorComponent, {
      data: { existentes },
      width: '500px'
    });
    const nuevo = (await firstValueFrom(ref.afterClosed())) as SujetoPermiso | null;
    if (!nuevo) return;
    this.config.permisosDefaultAdHoc[lista] = [...existentes, nuevo];
    this.persistir();
  }

  quitarSujetoAdHoc(lista: ListaPermiso, index: number): void {
    const nueva = [...this.config.permisosDefaultAdHoc[lista]];
    nueva.splice(index, 1);
    this.config.permisosDefaultAdHoc[lista] = nueva;
    this.persistir();
  }

  // -------- Helpers de presentación --------

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

  describirDocumento(d: DocumentoConfig): string {
    const partes: string[] = [];
    if (d.formatosAceptados.length > 0) partes.push(d.formatosAceptados.join('/').toUpperCase());
    if (d.obligatorio) partes.push('obligatorio');
    if (d.inmutablePostCierre) partes.push('inmutable post-cierre');
    return partes.join(' · ');
  }
}
