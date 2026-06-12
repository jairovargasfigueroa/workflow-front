import { Component, OnChanges, SimpleChanges, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { CampoFormulario } from '../../../formularios/models/formulario.model';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { TIPO_CAMPO_LABELS } from '../../../../core/models';
import {
  escribirCamposFormulario,
  leerCamposFormulario
} from '../../services/campos-formulario-bpmn.helper';
import {
  CampoFormularioFormComponent,
  CampoFormularioFormData
} from '../campo-formulario-form/campo-formulario-form';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { FeedbackService } from '../../../../core/services/feedback.service';

/**
 * Constructor inline de campos del formulario, dentro de un nodo (UserTask) del editor BPMN.
 * Se serializa al XML como camunda:Property "camposFormulario" (mismo patrón que la config documental).
 *
 * Semántica (definida por el back): si el nodo tiene campos inline, REEMPLAZAN al formulario
 * de plantilla (no se mezclan). Vacío = el nodo usa la plantilla (formKey).
 */
@Component({
  selector: 'app-nodo-campos-formulario',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './nodo-campos-formulario.html',
  styleUrl: './nodo-campos-formulario.scss'
})
export class NodoCamposFormularioComponent implements OnChanges {
  modeler = input<any>(null);
  element = input<any>(null);
  /** formKey de la plantilla seleccionada en el nodo (para "cargar desde plantilla"). */
  formularioId = input<string>('');

  private readonly matDialog = inject(MatDialog);
  private readonly formulariosService = inject(FormulariosService);
  private readonly feedback = inject(FeedbackService);

  readonly tipoLabels = TIPO_CAMPO_LABELS;

  campos = signal<CampoFormulario[]>([]);
  cargandoPlantilla = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['element']) {
      const el = this.element();
      this.campos.set(el ? leerCamposFormulario(el) : []);
    }
  }

  private persistir(): void {
    escribirCamposFormulario(this.modeler(), this.element(), this.campos());
  }

  describirCampo(c: CampoFormulario): string {
    const partes: string[] = [this.tipoLabels[c.tipo] ?? c.tipo];
    if (c.requerido) partes.push('requerido');
    return partes.join(' · ');
  }

  // -------- CRUD de campos --------

  async agregarCampo(): Promise<void> {
    const data: CampoFormularioFormData = {
      campo: { nombre: '', etiqueta: '', tipo: 'TEXT', requerido: false },
      titulo: 'Nuevo campo'
    };
    const result = await this.abrirDialogo(data);
    if (!result) return;
    if (this.nombreDuplicado(result.nombre)) {
      this.feedback.warn(`Ya existe un campo con el nombre "${result.nombre}".`);
      return;
    }
    this.campos.set([...this.campos(), result]);
    this.persistir();
  }

  async editarCampo(index: number): Promise<void> {
    const original = this.campos()[index];
    const data: CampoFormularioFormData = {
      campo: original,
      titulo: `Editar campo — ${original.etiqueta}`
    };
    const result = await this.abrirDialogo(data);
    if (!result) return;
    if (this.nombreDuplicado(result.nombre, index)) {
      this.feedback.warn(`Ya existe otro campo con el nombre "${result.nombre}".`);
      return;
    }
    const nueva = [...this.campos()];
    nueva[index] = result;
    this.campos.set(nueva);
    this.persistir();
  }

  async quitarCampo(index: number): Promise<void> {
    const campo = this.campos()[index];
    const confirmado = await firstValueFrom(
      this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Quitar campo?',
          message: `Se eliminará "${campo.etiqueta}" de este nodo.`,
          confirmText: 'Quitar',
          cancelText: 'Cancelar',
          confirmColor: 'warn'
        }
      }).afterClosed()
    );
    if (!confirmado) return;
    const nueva = [...this.campos()];
    nueva.splice(index, 1);
    this.campos.set(nueva);
    this.persistir();
  }

  // -------- Cargar desde plantilla (override) --------

  async cargarDesdePlantilla(): Promise<void> {
    const formKey = this.formularioId();
    if (!formKey) return;

    // Si ya hay campos inline, confirmamos antes de reemplazar.
    if (this.campos().length > 0) {
      const confirmado = await firstValueFrom(
        this.matDialog.open(ConfirmDialogComponent, {
          data: {
            title: '¿Reemplazar los campos actuales?',
            message: 'Se reemplazarán los campos inline de este nodo por los de la plantilla. Podés editarlos después.',
            confirmText: 'Reemplazar',
            cancelText: 'Cancelar',
            confirmColor: 'warn'
          }
        }).afterClosed()
      );
      if (!confirmado) return;
    }

    this.cargandoPlantilla.set(true);
    try {
      const plantilla = await firstValueFrom(this.formulariosService.getById(formKey));
      const copia = (plantilla.campos ?? []).map(c => ({ ...c }));
      this.campos.set(copia);
      this.persistir();
      this.feedback.success(`Se cargaron ${copia.length} campo(s) de "${plantilla.titulo}". Editalos a gusto.`);
    } catch {
      this.feedback.error('No se pudo cargar la plantilla seleccionada.');
    } finally {
      this.cargandoPlantilla.set(false);
    }
  }

  // -------- helpers --------

  private nombreDuplicado(nombre: string, exceptoIndex?: number): boolean {
    const n = nombre.trim().toLowerCase();
    return this.campos().some((c, i) => i !== exceptoIndex && c.nombre.trim().toLowerCase() === n);
  }

  private async abrirDialogo(data: CampoFormularioFormData): Promise<CampoFormulario | null> {
    const ref = this.matDialog.open(CampoFormularioFormComponent, {
      data,
      width: '600px',
      maxHeight: '88vh'
    });
    return (await firstValueFrom(ref.afterClosed())) ?? null;
  }
}
