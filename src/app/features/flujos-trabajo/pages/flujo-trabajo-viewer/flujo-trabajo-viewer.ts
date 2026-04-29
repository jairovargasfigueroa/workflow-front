import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

import BpmnNavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import customRendererModule from '../flujo-trabajo-editor/custom-modules/custom-renderer';

import { FlujosTrabajoService } from '../../services/flujos-trabajo.service';
import { FlujoTrabajo, FlujoVersion } from '../../models/flujo-trabajo.model';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-flujo-trabajo-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  templateUrl: './flujo-trabajo-viewer.html',
  styleUrl: './flujo-trabajo-viewer.scss'
})
export class FlujoTrabajoViewerComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flujosService = inject(FlujosTrabajoService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  private viewer!: BpmnNavigatedViewer;

  flujo = signal<FlujoTrabajo | null>(null);
  versiones = signal<FlujoVersion[]>([]);
  loading = signal(true);
  restaurando = signal(false);
  versionSeleccionada = signal<number | null>(null);
  flujoId = '';

  ngOnInit(): void {
    this.flujoId = this.route.snapshot.paramMap.get('id')!;
    this.initViewer();
    this.loadFlujo();
  }

  ngOnDestroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  private initViewer(): void {
    this.viewer = new BpmnNavigatedViewer({
      container: this.canvasRef.nativeElement,
      additionalModules: [customRendererModule]
    });
  }

  private loadFlujo(): void {
    this.flujosService.getById(this.flujoId).subscribe({
      next: (flujo) => {
        this.flujo.set(flujo);
        this.flujosService.getVersiones(this.flujoId).subscribe({
          next: (versiones) => {
            this.versiones.set(versiones);
            if (flujo.versionActualNumero) {
              this.cargarVersion(flujo.versionActualNumero);
            } else {
              this.loading.set(false);
            }
          },
          error: () => { this.loading.set(false); }
        });
      },
      error: () => { this.loading.set(false); }
    });
  }

  cargarVersion(numero: number): void {
    this.loading.set(true);
    this.versionSeleccionada.set(numero);
    this.flujosService.getVersion(this.flujoId, numero).subscribe({
      next: (version) => {
        this.viewer.importXML(version.xml).then(() => {
          const canvas: any = this.viewer.get('canvas');
          canvas.zoom('fit-viewport');
          this.loading.set(false);
        }).catch(() => { this.loading.set(false); });
      },
      error: () => { this.loading.set(false); }
    });
  }

  onRestaurar(): void {
    const numero = this.versionSeleccionada();
    if (!numero) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Restaurar versión como borrador',
        message: `¿Cargar la v${numero} como borrador? El borrador actual se perderá.`,
        confirmText: 'Restaurar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.restaurando.set(true);
      this.flujosService.copiarVersionComoBorrador(this.flujoId, { numeroVersion: numero }).subscribe({
        next: () => {
          this.notificationService.add({
            title: 'Versión restaurada',
            message: `La v${numero} fue cargada como borrador`,
            type: 'success'
          });
          this.restaurando.set(false);
          this.router.navigate(['/flujos-trabajo', this.flujoId, 'editor']);
        },
        error: () => {
          this.notificationService.add({
            title: 'Error',
            message: 'No se pudo restaurar la versión',
            type: 'error'
          });
          this.restaurando.set(false);
        }
      });
    });
  }

  onZoomIn(): void {
    const canvas: any = this.viewer.get('canvas');
    canvas.zoom('in');
  }

  onZoomOut(): void {
    const canvas: any = this.viewer.get('canvas');
    canvas.zoom('out');
  }

  onZoomReset(): void {
    const canvas: any = this.viewer.get('canvas');
    canvas.zoom('fit-viewport');
  }

  onVolver(): void {
    this.router.navigate(['/flujos-trabajo']);
  }
}
