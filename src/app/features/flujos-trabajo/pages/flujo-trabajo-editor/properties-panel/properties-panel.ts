import { Component, input, effect, signal, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { FormulariosService } from '../../../../formularios/services/formularios.service';
import { FlujosTrabajoService } from '../../../services/flujos-trabajo.service';
import { Departamento } from '../../../../departamentos/models/departamento.model';
import { FormularioTemplate } from '../../../../formularios/models/formulario.model';
import { AccionFlujo } from '../../../models/accion-flujo.model';
import { NodoConfigDocumentalComponent } from '../../../components/nodo-config-documental/nodo-config-documental';
import { NodoCamposFormularioComponent } from '../../../components/nodo-campos-formulario/nodo-campos-formulario';
import {
  encontrarLaneDeFlowNode,
  escribirDepartamentoIdEnLane,
  leerCandidateGroupsDirecto,
  leerDepartamentoIdDeLane
} from '../../../services/lane-departamento-bpmn.helper';
import {
  escribirSlaNodoHoras,
  leerSlaNodoHoras
} from '../../../services/sla-nodo-bpmn.helper';

type UserTaskDepartamentoFuente = 'lane' | 'lane-sin-dpto' | 'legacy' | 'ninguno';

interface UserTaskDepartamentoInfo {
  fuente: UserTaskDepartamentoFuente;
  carrilNombre: string | null;
  departamentoId: string | null;
  departamentoNombre: string | null;
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    NodoConfigDocumentalComponent,
    NodoCamposFormularioComponent
  ],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss'
})
export class PropertiesPanelComponent implements OnDestroy {
  modeler = input<any>(null);

  private readonly departamentosService = inject(DepartamentosService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly flujosService = inject(FlujosTrabajoService);

  departamentos = signal<Departamento[]>([]);
  formularios = signal<FormularioTemplate[]>([]);
  acciones = signal<AccionFlujo[]>([]);
  selectedElement = signal<any>(null);
  elementType = signal<string>('');
  elementName = signal<string>('');
  formularioId = signal<string>('');
  laneDepartamentoId = signal<string>('');
  slaNodoHoras = signal<number | null>(null);

  // Solo las acciones finales (para el dropdown del EndEvent).
  readonly accionesFinales = computed(() => this.acciones().filter(a => a.esFinal));

  // ¿La flecha seleccionada sale de un gateway EXCLUSIVO? (define si lleva etiqueta).
  readonly flechaEsDecision = computed<boolean>(() => {
    if (this.elementType() !== 'bpmn:SequenceFlow') return false;
    const el = this.selectedElement();
    return el?.businessObject?.sourceRef?.$type === 'bpmn:ExclusiveGateway';
  });

  private eventBus: any;

  // Derivado: cuando un UserTask está seleccionado, calcular de dónde viene su departamento.
  readonly userTaskDepartamento = computed<UserTaskDepartamentoInfo>(() => {
    if (this.elementType() !== 'bpmn:UserTask') {
      return { fuente: 'ninguno', carrilNombre: null, departamentoId: null, departamentoNombre: null };
    }
    const el = this.selectedElement();
    const modeler = this.modeler();
    if (!el || !modeler) {
      return { fuente: 'ninguno', carrilNombre: null, departamentoId: null, departamentoNombre: null };
    }

    const lane = encontrarLaneDeFlowNode(modeler, el);
    if (lane) {
      const dptoId = leerDepartamentoIdDeLane(lane);
      if (dptoId) {
        const dpto = this.departamentos().find(d => d.id === dptoId);
        return {
          fuente: 'lane',
          carrilNombre: lane.businessObject?.name || lane.id,
          departamentoId: dptoId,
          departamentoNombre: dpto?.nombre ?? `(desconocido: ${dptoId})`
        };
      }
      return {
        fuente: 'lane-sin-dpto',
        carrilNombre: lane.businessObject?.name || lane.id,
        departamentoId: null,
        departamentoNombre: null
      };
    }

    const legacy = leerCandidateGroupsDirecto(el);
    if (legacy) {
      const dpto = this.departamentos().find(d => d.id === legacy);
      return {
        fuente: 'legacy',
        carrilNombre: null,
        departamentoId: legacy,
        departamentoNombre: dpto?.nombre ?? legacy
      };
    }

    return { fuente: 'ninguno', carrilNombre: null, departamentoId: null, departamentoNombre: null };
  });

  // Para mostrar el nombre del dpto en el dropdown del Lane.
  readonly laneDepartamentoNombre = computed(() => {
    const id = this.laneDepartamentoId();
    if (!id) return '';
    return this.departamentos().find(d => d.id === id)?.nombre ?? id;
  });

  constructor() {
    this.departamentosService.getAll().subscribe({
      next: (deps) => this.departamentos.set(deps),
      error: (err) => console.error('Error cargando departamentos:', err)
    });

    this.formulariosService.getAll().subscribe({
      next: (forms) => this.formularios.set(forms.filter(f => f.activo)),
      error: (err) => console.error('Error cargando formularios:', err)
    });

    this.flujosService.getAccionesFlujo().subscribe({
      next: (acciones) => this.acciones.set(acciones),
      error: (err) => console.error('Error cargando catálogo de acciones:', err)
    });

    effect(() => {
      const modeler = this.modeler();
      if (modeler) {
        this.setupListeners(modeler);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeListeners();
  }

  private setupListeners(modeler: any): void {
    this.removeListeners();
    this.eventBus = modeler.get('eventBus');
    this.eventBus.on('selection.changed', this.onSelectionChanged);
    this.eventBus.on('element.changed', this.onElementChanged);
  }

  private removeListeners(): void {
    if (this.eventBus) {
      this.eventBus.off('selection.changed', this.onSelectionChanged);
      this.eventBus.off('element.changed', this.onElementChanged);
    }
  }

  private onSelectionChanged = (e: any): void => {
    const newSelection = e.newSelection;
    if (newSelection && newSelection.length === 1) {
      this.selectElement(newSelection[0]);
    } else {
      this.clearSelection();
    }
  };

  private onElementChanged = (e: any): void => {
    const selected = this.selectedElement();
    if (selected && e.element && e.element.id === selected.id) {
      this.updateFromElement(e.element);
    }
  };

  private selectElement(element: any): void {
    this.selectedElement.set(element);
    this.updateFromElement(element);
  }

  private updateFromElement(element: any): void {
    const bo = element.businessObject;
    if (!bo) return;

    this.elementType.set(bo.$type || '');
    this.elementName.set(bo.name || '');

    if (bo.$type === 'bpmn:UserTask') {
      this.formularioId.set(bo.get('camunda:formKey') || '');
      this.slaNodoHoras.set(leerSlaNodoHoras(element));
    } else {
      this.formularioId.set('');
      this.slaNodoHoras.set(null);
    }

    if (bo.$type === 'bpmn:Lane') {
      this.laneDepartamentoId.set(leerDepartamentoIdDeLane(element) ?? '');
    } else {
      this.laneDepartamentoId.set('');
    }
  }

  private clearSelection(): void {
    this.selectedElement.set(null);
    this.elementType.set('');
    this.elementName.set('');
    this.formularioId.set('');
    this.laneDepartamentoId.set('');
    this.slaNodoHoras.set(null);
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.elementName.set(value);
    this.updateProperty('name', value || undefined);
  }

  /** Setea la etiqueta de una flecha (gateway exclusivo) o el nombre de un EndEvent desde el catálogo. */
  onAccionChange(etiqueta: string): void {
    this.elementName.set(etiqueta);
    this.updateProperty('name', etiqueta || undefined);
  }

  onFormularioChange(value: string): void {
    this.formularioId.set(value);
    this.updateProperty('camunda:formKey', value || undefined);
  }

  onSlaNodoChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const horas = raw === '' ? null : Math.max(0, parseInt(raw, 10));
    const validas = horas != null && Number.isFinite(horas) && horas > 0 ? horas : null;
    this.slaNodoHoras.set(validas);
    const modeler = this.modeler();
    const element = this.selectedElement();
    if (!modeler || !element) return;
    escribirSlaNodoHoras(modeler, element, validas);
  }

  onLaneDepartamentoChange(value: string): void {
    this.laneDepartamentoId.set(value);
    const modeler = this.modeler();
    const element = this.selectedElement();
    if (!modeler || !element) return;

    escribirDepartamentoIdEnLane(modeler, element, value || null);

    // Sincronizar el nombre del carril con el nombre del departamento elegido.
    // Si el admin quiere un nombre custom, puede editarlo después.
    if (value) {
      const dpto = this.departamentos().find(d => d.id === value);
      if (dpto) {
        this.elementName.set(dpto.nombre);
        this.updateProperty('name', dpto.nombre);
      }
    }
  }

  private updateProperty(property: string, value: any): void {
    const modeler = this.modeler();
    const element = this.selectedElement();
    if (!modeler || !element) return;

    const modeling = modeler.get('modeling');
    modeling.updateProperties(element, { [property]: value });
  }

  getElementIcon(): string {
    switch (this.elementType()) {
      case 'bpmn:StartEvent': return 'play_circle';
      case 'bpmn:EndEvent': return 'stop_circle';
      case 'bpmn:UserTask': return 'person';
      case 'bpmn:ExclusiveGateway': return 'call_split';
      case 'bpmn:ParallelGateway': return 'add_box';
      case 'bpmn:SequenceFlow': return 'arrow_forward';
      case 'bpmn:Lane': return 'view_stream';
      case 'bpmn:Participant': return 'view_module';
      default: return 'widgets';
    }
  }

  getElementTypeLabel(): string {
    switch (this.elementType()) {
      case 'bpmn:StartEvent': return 'Evento de Inicio';
      case 'bpmn:EndEvent': return 'Evento de Fin';
      case 'bpmn:UserTask': return 'Tarea de Usuario';
      case 'bpmn:ExclusiveGateway': return 'Compuerta Exclusiva';
      case 'bpmn:ParallelGateway': return 'Compuerta Paralela';
      case 'bpmn:SequenceFlow': return 'Flujo de Secuencia';
      case 'bpmn:Lane': return 'Carril';
      case 'bpmn:Participant': return 'Pool (Proceso)';
      case 'bpmn:Process': return 'Proceso';
      default: return this.elementType();
    }
  }
}
