import { Component, input, effect, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { DepartamentosService } from '../../../../departamentos/services/departamentos.service';
import { Departamento } from '../../../../departamentos/models/departamento.model';

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
    MatDividerModule
  ],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss'
})
export class PropertiesPanelComponent implements OnDestroy {
  modeler = input<any>(null);

  private readonly departamentosService = inject(DepartamentosService);

  departamentos = signal<Departamento[]>([]);
  selectedElement = signal<any>(null);
  elementType = signal<string>('');
  elementName = signal<string>('');
  candidateGroups = signal<string>('');
  conditionExpression = signal<string>('');
  isFromExclusiveGateway = signal(false);

  readonly conditionOptions = [
    { value: '${aprobado == true}', label: 'Aprobado (sí)' },
    { value: '${aprobado == false}', label: 'Rechazado (no)' }
  ];

  private eventBus: any;

  constructor() {
    this.departamentosService.getAll().subscribe({
      next: (deps) => this.departamentos.set(deps),
      error: (err) => console.error('Error cargando departamentos:', err)
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
      this.candidateGroups.set(bo.get('camunda:candidateGroups') || '');
    } else {
      this.candidateGroups.set('');
    }

    if (bo.$type === 'bpmn:SequenceFlow') {
      const source = element.source;
      this.isFromExclusiveGateway.set(
        source?.businessObject?.$type === 'bpmn:ExclusiveGateway'
      );
      const condition = bo.conditionExpression;
      this.conditionExpression.set(condition?.body || '');
    } else {
      this.isFromExclusiveGateway.set(false);
      this.conditionExpression.set('');
    }
  }

  private clearSelection(): void {
    this.selectedElement.set(null);
    this.elementType.set('');
    this.elementName.set('');
    this.candidateGroups.set('');
    this.conditionExpression.set('');
    this.isFromExclusiveGateway.set(false);
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.elementName.set(value);
    this.updateProperty('name', value || undefined);
  }

  onCandidateGroupsChange(value: string): void {
    this.candidateGroups.set(value);
    this.updateProperty('camunda:candidateGroups', value || undefined);
  }

  onConditionChange(value: string): void {
    this.conditionExpression.set(value);
    const modeler = this.modeler();
    const element = this.selectedElement();
    if (!modeler || !element) return;

    const modeling = modeler.get('modeling');
    const moddle = modeler.get('moddle');

    if (value) {
      const conditionExpression = moddle.create('bpmn:FormalExpression', { body: value });
      modeling.updateProperties(element, { conditionExpression });
    } else {
      modeling.updateProperties(element, { conditionExpression: undefined });
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
      case 'bpmn:Process': return 'Proceso';
      default: return this.elementType();
    }
  }
}
