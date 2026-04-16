import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import { environment } from '../../../../../environments/environment';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

import customPaletteModule from './custom-modules/custom-palette';
import customContextPadModule from './custom-modules/custom-context-pad';
import { PropertiesPanelComponent } from './properties-panel/properties-panel';
import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import { FlujoTrabajo } from '../../models/flujo-trabajo.model';

@Component({
  selector: 'app-flujo-trabajo-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    PropertiesPanelComponent
  ],
  templateUrl: './flujo-trabajo-editor.html',
  styleUrl: './flujo-trabajo-editor.scss'
})
export class FlujoTrabajoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flujosService = inject(FlujosTrabajoService);
  private readonly snackBar = inject(MatSnackBar);

  private modeler!: BpmnModeler;
  private stompClient!: Client;
  private subscription?: StompSubscription;
  private debounceTimer?: any;
  private lastXmlSent: string = '';

  flujo = signal<FlujoTrabajo | null>(null);
  loading = signal(true);
  deploying = signal(false);
  connectedUsers = signal(0);
  modelerReady = signal<BpmnModeler | null>(null);
  flujoId = '';

  ngOnInit(): void {
    this.flujoId = this.route.snapshot.paramMap.get('id')!;
    this.initBpmnModeler();
    this.loadFlujo();
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.modeler) {
      this.modeler.destroy();
    }
  }

  private initBpmnModeler(): void {
    this.modeler = new BpmnModeler({
      container: this.canvasRef.nativeElement,
      keyboard: {
        bindTo: document
      },
      moddleExtensions: {
        camunda: camundaModdleDescriptor
      },
      additionalModules: [
        customPaletteModule,
        customContextPadModule
      ]
    });

    this.modelerReady.set(this.modeler);

    // Escuchar cambios en el diagrama
    this.modeler.on('commandStack.changed', () => {
      this.onDiagramChange();
    });
  }

  private loadFlujo(): void {
    this.loading.set(true);

    this.flujosService.getById(this.flujoId).subscribe({
      next: (flujo) => {
        this.flujo.set(flujo);
        this.loadDiagram(flujo.procesoKey);
      },
      error: (error) => {
        console.error('Error al cargar flujo:', error);
        this.snackBar.open('Error al cargar el flujo de trabajo', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private loadDiagram(procesoKey: string): void {
    this.flujosService.getDeployedXml(this.flujoId).subscribe({
      next: (response) => {
        this.modeler.importXML(response.xml).then(() => {
          this.forceProcessProperties(procesoKey);
          this.loading.set(false);
          this.connectWebSocket();
        }).catch(err => {
          console.error('Error al importar XML:', err);
          this.createNewDiagram(procesoKey);
        });
      },
      error: () => {
        // No hay diagrama desplegado, crear diagrama vacío
        this.createNewDiagram(procesoKey);
      }
    });
  }

  private createNewDiagram(procesoKey: string): void {
    const xml = this.getEmptyDiagramXml(procesoKey);
    this.modeler.importXML(xml).then(() => {
      this.loading.set(false);
      this.connectWebSocket();
    }).catch(err => {
      console.error('Error al crear diagrama:', err);
      this.loading.set(false);
    });
  }

  private forceProcessProperties(procesoKey: string): void {
    const canvas: any = this.modeler.get('canvas');
    const modeling: any = this.modeler.get('modeling');
    const rootElement = canvas.getRootElement();

    if (rootElement?.businessObject) {
      modeling.updateProperties(rootElement, {
        id: procesoKey,
        isExecutable: true
      });
    }
  }

  private getEmptyDiagramXml(procesoKey: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  targetNamespace="http://bpmn.io/schema/bpmn"
  id="Definitions_1">
  <bpmn:process id="${procesoKey}" name="${procesoKey}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Inicio" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${procesoKey}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private connectWebSocket(): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      onConnect: () => {
        console.log('WebSocket conectado');
        this.subscribeToChanges();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    this.stompClient.activate();
  }

  private subscribeToChanges(): void {
    if (!this.stompClient.connected) return;

    this.subscription = this.stompClient.subscribe(
      `/topic/flujo/${this.flujoId}`,
      (message) => {
        const xmlReceived = message.body;

        // Ignorar mensajes que nosotros mismos enviamos
        if (xmlReceived === this.lastXmlSent) {
          return;
        }

        // Importar el XML recibido
        this.modeler.importXML(xmlReceived).catch(err => {
          console.error('Error al importar cambios:', err);
        });
      }
    );
  }

  private onDiagramChange(): void {
    // Debounce para no enviar cada cambio inmediatamente
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.sendChanges();
    }, 500);
  }

  private sendChanges(): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    this.modeler.saveXML({ format: true }).then(({ xml }) => {
      if (!xml) return;

      this.lastXmlSent = xml;

      this.stompClient.publish({
        destination: `/app/flujo/${this.flujoId}`,
        body: xml
      });
    }).catch(err => {
      console.error('Error al guardar XML:', err);
    });
  }

  private disconnectWebSocket(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  onDesplegar(): void {
    this.deploying.set(true);

    this.modeler.saveXML({ format: true }).then(({ xml }) => {
      if (!xml) {
        this.snackBar.open('No hay diagrama para desplegar', 'Cerrar', { duration: 3000 });
        this.deploying.set(false);
        return;
      }

      this.flujosService.desplegar(this.flujoId, { xml }).subscribe({
        next: () => {
          this.snackBar.open('✓ Flujo desplegado exitosamente en Camunda', 'Cerrar', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.deploying.set(false);
        },
        error: (error) => {
          console.error('Error al desplegar:', error);
          this.snackBar.open('Error al desplegar el flujo', 'Cerrar', { duration: 3000 });
          this.deploying.set(false);
        }
      });
    }).catch(err => {
      console.error('Error al exportar XML:', err);
      this.deploying.set(false);
    });
  }

  onVolver(): void {
    this.router.navigate(['/flujos-trabajo']);
  }

  onZoomIn(): void {
    const canvas: any = this.modeler.get('canvas');
    canvas.zoom('in');
  }

  onZoomOut(): void {
    const canvas: any = this.modeler.get('canvas');
    canvas.zoom('out');
  }

  onZoomReset(): void {
    const canvas: any = this.modeler.get('canvas');
    canvas.zoom('fit-viewport');
  }
}
