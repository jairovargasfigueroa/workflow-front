import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import { switchMap, map, catchError, of } from 'rxjs';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import { environment } from '../../../../../environments/environment';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

import customPaletteModule from './custom-modules/custom-palette';
import customContextPadModule from './custom-modules/custom-context-pad';
import { PropertiesPanelComponent } from './properties-panel/properties-panel';
import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import {
  FlujoTrabajo,
  FlujoVersion,
  EstadoFlujo,
  ESTADO_FLUJO_LABELS
} from '../../models/flujo-trabajo.model';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { PublishErrorsDialogComponent } from '../../components/publish-errors-dialog/publish-errors-dialog';

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
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    PropertiesPanelComponent
  ],
  templateUrl: './flujo-trabajo-editor.html',
  styleUrl: './flujo-trabajo-editor.scss'
})
export class FlujoTrabajoEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flujosService = inject(FlujosTrabajoService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private modeler!: BpmnModeler;
  private stompClient!: Client;
  private subscription?: StompSubscription;
  private debounceTimer?: any;
  private lastXmlSent: string = '';
  private isInitialLoad = true;

  flujo = signal<FlujoTrabajo | null>(null);
  versiones = signal<FlujoVersion[]>([]);
  loading = signal(true);
  publishing = signal(false);
  savingBorrador = signal(false);
  descartando = signal(false);
  modelerReady = signal<BpmnModeler | null>(null);
  hasElementSelected = signal(false);
  showVersiones = signal(false);
  flujoId = '';

  readonly estadoLabels = ESTADO_FLUJO_LABELS;

  ngOnInit(): void {
    this.flujoId = this.route.snapshot.paramMap.get('id')!;
  }

  ngAfterViewInit(): void {
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

    this.modeler.on('commandStack.changed', () => {
      this.onDiagramChange();
    });

    this.modeler.on('selection.changed', (e: any) => {
      this.hasElementSelected.set(e.newSelection?.length > 0);
    });
  }

  private loadFlujo(): void {
    this.loading.set(true);

    this.flujosService.getById(this.flujoId).pipe(
      switchMap(flujo => {
        this.flujo.set(flujo);
        this.loadVersiones();

        const shouldLoadXml = flujo.tieneBorrador || flujo.estadoFlujo === 'ACTIVO';
        if (!shouldLoadXml) {
          return of({ flujo, xml: null as string | null });
        }

        return this.flujosService.getXml(this.flujoId).pipe(
          map(xml => ({ flujo, xml })),
          catchError(() => of({ flujo, xml: null as string | null }))
        );
      })
    ).subscribe({
      next: ({ flujo, xml }) => {
        if (xml) {
          this.importXml(xml, flujo.procesoKey);
        } else {
          this.createNewDiagram(flujo.procesoKey);
        }
      },
      error: () => {
        this.snackBar.open('Error al cargar el flujo de trabajo', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private loadVersiones(): void {
    this.flujosService.getVersiones(this.flujoId).subscribe({
      next: (v) => this.versiones.set(v),
      error: () => {}
    });
  }

  private importXml(xml: string, procesoKey: string): void {
    this.modeler.importXML(xml).then(() => {
      this.forceProcessProperties(procesoKey);
      const canvas: any = this.modeler.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
      this.loading.set(false);
      this.connectWebSocket();
      setTimeout(() => { this.isInitialLoad = false; }, 600);
    }).catch(() => {
      this.createNewDiagram(procesoKey);
    });
  }

  private createNewDiagram(procesoKey: string): void {
    const xml = this.getEmptyDiagramXml(procesoKey);
    this.modeler.importXML(xml).then(() => {
      const canvas: any = this.modeler.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
      this.loading.set(false);
      this.connectWebSocket();
      setTimeout(() => { this.isInitialLoad = false; }, 600);
    }).catch(() => {
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
      debug: () => {},
      onConnect: () => {
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
        if (xmlReceived === this.lastXmlSent) return;
        this.modeler.importXML(xmlReceived).catch(() => {});
      }
    );
  }

  private onDiagramChange(): void {
    if (this.isInitialLoad) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.sendChanges();
    }, 500);
  }

  private sendChanges(): void {
    this.modeler.saveXML({ format: true }).then(({ xml }) => {
      if (!xml) return;

      this.lastXmlSent = xml;

      // Sincronización en tiempo real vía WebSocket
      if (this.stompClient?.connected) {
        this.stompClient.publish({
          destination: `/app/flujo/${this.flujoId}`,
          body: xml
        });
      }

      // Persistencia del borrador
      this.savingBorrador.set(true);
      this.flujosService.guardarBorrador(this.flujoId, { xml }).subscribe({
        next: (flujo) => {
          this.flujo.set(flujo);
          this.savingBorrador.set(false);
        },
        error: () => {
          this.savingBorrador.set(false);
        }
      });
    }).catch(() => {});
  }

  private disconnectWebSocket(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  onPublicar(): void {
    this.publishing.set(true);

    this.flujosService.publicar(this.flujoId).subscribe({
      next: (flujo) => {
        this.flujo.set(flujo);
        this.loadVersiones();
        this.snackBar.open('Flujo publicado exitosamente', 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });
        this.publishing.set(false);
      },
      error: (error) => {
        if (error.status === 422 && error.error?.errores) {
          this.dialog.open(PublishErrorsDialogComponent, {
            width: '500px',
            data: { errores: error.error.errores }
          });
        } else {
          this.snackBar.open('Error al publicar el flujo', 'Cerrar', { duration: 3000 });
        }
        this.publishing.set(false);
      }
    });
  }

  onCopiarVersionComoBorrador(version: FlujoVersion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Restaurar versión',
        message: `¿Cargar la versión ${version.numero} como borrador actual? El borrador actual se perderá.`,
        confirmText: 'Restaurar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.flujosService.copiarVersionComoBorrador(this.flujoId, { numeroVersion: version.numero }).subscribe({
        next: (flujo) => {
          this.flujo.set(flujo);
          this.flujosService.getXml(this.flujoId).subscribe({
            next: (xml) => this.importXml(xml, flujo.procesoKey),
            error: () => {}
          });
          this.snackBar.open(`Versión ${version.numero} cargada como borrador`, 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al restaurar la versión', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

  hasBorrador(): boolean {
    return this.flujo()?.tieneBorrador ?? false;
  }

  onDescartar(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Descartar borrador',
        message: '¿Descartar todos los cambios sin publicar? Esta acción no se puede deshacer.',
        confirmText: 'Descartar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.descartando.set(true);
      this.flujosService.descartarBorrador(this.flujoId).pipe(
        switchMap(flujo => {
          this.flujo.set(flujo);
          return this.flujosService.getXml(this.flujoId).pipe(
            catchError(() => of(null as string | null))
          );
        })
      ).subscribe({
        next: (xml) => {
          const flujo = this.flujo()!;
          if (xml) {
            this.importXml(xml, flujo.procesoKey);
          } else {
            this.createNewDiagram(flujo.procesoKey);
          }
          this.descartando.set(false);
          this.snackBar.open('Borrador descartado', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.descartando.set(false);
          this.snackBar.open('Error al descartar el borrador', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

  canPublicar(): boolean {
    const flujo = this.flujo();
    return flujo?.estadoFlujo !== 'ARCHIVADO' && flujo?.tieneBorrador === true;
  }

  getEstadoClass(estado: EstadoFlujo): string {
    const map: Record<EstadoFlujo, string> = {
      SIN_PUBLICAR: 'flujo-sin-publicar',
      ACTIVO: 'flujo-activo',
      DESACTIVADO: 'flujo-desactivado',
      ARCHIVADO: 'flujo-archivado'
    };
    return map[estado] ?? '';
  }

  toggleVersiones(): void {
    this.showVersiones.update(v => !v);
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
