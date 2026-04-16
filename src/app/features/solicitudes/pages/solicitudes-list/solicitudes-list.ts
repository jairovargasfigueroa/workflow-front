import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudTramite } from '../../models/solicitud.model';
import { SolicitudDialogComponent } from '../../components/solicitud-dialog/solicitud-dialog';
import { RespuestaDialogComponent } from '../../components/respuesta-dialog/respuesta-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';
import { TramitesService } from '../../../tramites/services/tramites.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Tramite } from '../../../tramites/models/tramite.model';
import { Departamento } from '../../../departamentos/models/departamento.model';
import { ESTADO_TRAMITE_LABELS, EstadoTramite } from '../../../../core/models';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  templateUrl: './solicitudes-list.html',
  styleUrl: './solicitudes-list.scss'
})
export class SolicitudesListComponent implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly tramitesService = inject(TramitesService);
  private readonly departamentosService = inject(DepartamentosService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  solicitudes = signal<SolicitudTramite[]>([]);
  tramites = signal<Tramite[]>([]);
  departamentos = signal<Departamento[]>([]);
  loading = signal(true);

  filtroEstado = signal<EstadoTramite | ''>('');
  filtroTramite = signal<string>('');
  filtroDepartamento = signal<string>('');

  displayedColumns = ['tramite', 'solicitante', 'estado', 'departamento', 'fecha', 'acciones'];
  estadoLabels = ESTADO_TRAMITE_LABELS;
  estados: EstadoTramite[] = ['PENDIENTE', 'EN_PROCESO', 'OBSERVADO', 'APROBADO', 'RECHAZADO'];

  getEstadoLabel(estado: EstadoTramite): string {
    return ESTADO_TRAMITE_LABELS[estado];
  }

  solicitudesFiltradas = computed(() => {
    let result = this.solicitudes();
    const estado = this.filtroEstado();
    const tramite = this.filtroTramite();
    const depto = this.filtroDepartamento();

    if (estado) {
      result = result.filter(s => s.estado === estado);
    }
    if (tramite) {
      result = result.filter(s => s.tramiteId === tramite);
    }
    if (depto) {
      result = result.filter(s => s.departamentoActualId === depto);
    }
    return result;
  });

  ngOnInit(): void {
    this.loadSolicitudes();
    this.tramitesService.getAll().subscribe(data => this.tramites.set(data));
    this.departamentosService.getAll().subscribe(data => this.departamentos.set(data));
  }

  loadSolicitudes(): void {
    this.loading.set(true);
    this.solicitudesService.getAll().subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getTramiteNombre(tramiteId: string): string {
    return this.tramites().find(t => t.id === tramiteId)?.nombre || tramiteId;
  }

  getDepartamentoNombre(deptoId: string | null): string {
    if (!deptoId) return '-';
    return this.departamentos().find(d => d.id === deptoId)?.nombre || deptoId;
  }

  getEstadoClass(estado: EstadoTramite): string {
    const classes: Record<EstadoTramite, string> = {
      PENDIENTE: 'estado-pendiente',
      EN_PROCESO: 'estado-proceso',
      OBSERVADO: 'estado-observado',
      APROBADO: 'estado-aprobado',
      RECHAZADO: 'estado-rechazado'
    };
    return classes[estado];
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SolicitudDialogComponent, {
      width: '700px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSolicitudes();
    });
  }

  openResponderDialog(solicitud: SolicitudTramite): void {
    const dialogRef = this.dialog.open(RespuestaDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { solicitud }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSolicitudes();
    });
  }

  verDetalle(solicitud: SolicitudTramite): void {
    this.router.navigate(['/solicitudes', solicitud.id]);
  }

  confirmDelete(solicitud: SolicitudTramite): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar solicitud',
        message: '¿Está seguro que desea eliminar esta solicitud?',
        confirmText: 'Eliminar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.solicitudesService.delete(solicitud.id).subscribe({
          next: () => {
            this.notificationService.add({
              title: 'Eliminada',
              message: 'Solicitud eliminada correctamente',
              type: 'success'
            });
            this.loadSolicitudes();
          }
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('');
    this.filtroTramite.set('');
    this.filtroDepartamento.set('');
  }
}
