import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudTramite } from '../../models/solicitud.model';
import { TramitesService } from '../../../tramites/services/tramites.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Tramite } from '../../../tramites/models/tramite.model';
import { Departamento } from '../../../departamentos/models/departamento.model';
import { ESTADO_TRAMITE_LABELS, EstadoTramite } from '../../../../core/models';
import { RespuestaDialogComponent } from '../../components/respuesta-dialog/respuesta-dialog';

@Component({
  selector: 'app-solicitud-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './solicitud-detail.html',
  styleUrl: './solicitud-detail.scss'
})
export class SolicitudDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly tramitesService = inject(TramitesService);
  private readonly departamentosService = inject(DepartamentosService);

  solicitud = signal<SolicitudTramite | null>(null);
  tramite = signal<Tramite | null>(null);
  departamentos = signal<Departamento[]>([]);
  loading = signal(true);
  estadoLabels = ESTADO_TRAMITE_LABELS;

  getEstadoLabel(estado: string): string {
    return ESTADO_TRAMITE_LABELS[estado as EstadoTramite] || estado;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSolicitud(id);
    }
    this.departamentosService.getAll().subscribe(data => this.departamentos.set(data));
  }

  loadSolicitud(id: string): void {
    this.solicitudesService.getById(id).subscribe({
      next: (data) => {
        this.solicitud.set(data);
        this.loading.set(false);
        if (data.tramiteId) {
          this.tramitesService.getById(data.tramiteId).subscribe({
            next: (t) => this.tramite.set(t)
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/solicitudes']);
      }
    });
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDuracion(fechaEntrada: string | undefined, fechaSalida: string): string {
    if (!fechaEntrada) return '';
    const diffMs = new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime();
    if (diffMs <= 0) return '';
    const totalMin = Math.floor(diffMs / 60000);
    const totalH = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (totalH >= 24) {
      const dias = Math.floor(totalH / 24);
      const horas = totalH % 24;
      return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`;
    }
    if (totalH > 0) return min > 0 ? `${totalH}h ${min}m` : `${totalH}h`;
    return `${totalMin}m`;
  }

  openResponderDialog(): void {
    const sol = this.solicitud();
    if (!sol) return;

    const dialogRef = this.dialog.open(RespuestaDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { solicitud: sol }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSolicitud(sol.id);
    });
  }

  goBack(): void {
    this.router.navigate(['/solicitudes']);
  }
}
