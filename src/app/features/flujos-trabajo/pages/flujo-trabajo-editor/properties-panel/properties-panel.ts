import { Component, input, effect, signal, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { FormulariosService } from '../../../../formularios/services/formularios.service';
import { Departamento } from '../../../../departamentos/models/departamento.model';
import { FormularioTemplate } from '../../../../formularios/models/formulario.model';
import { NodoConfigDocumentalComponent } from '../../../components/nodo-config-documental/nodo-config-documental';
import {
  encontrarLaneDeFlowNode,
  escribirDepartamentoIdEnLane,
  leerCandidateGroupsDirecto,
  leerDepartamentoIdDeLane
} from '../../../services/lane-departamento-bpmn.helper';

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
    NodoConfigDocumentalComponent
  ],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss'
})
export class PropertiesPanelComponent implements OnDestroy {
  modeler = input<any>(null);

  private readonly departamentosService = inject(DepartamentosService);
  private readonly formulariosService = inject(FormulariosService);

  departamentos = signal<Departamento[]>([]);
  formularios = signal<FormularioTemplate[]>([]);
  selectedElement = signal<any>(null);
  elementType = signal<string>('');
  elementName = signal<string>('');
  formularioId = signal<string>('');
  laneDepartamentoId = signal<string>('');

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
    } else {
      this.formularioId.set('');
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
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.elementName.set(value);
    this.updateProperty('name', value || undefined);
  }

  onFormularioChange(value: string): void {
    this.formularioId.set(value);
    this.updateProperty('camunda:formKey', value || undefined);
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
