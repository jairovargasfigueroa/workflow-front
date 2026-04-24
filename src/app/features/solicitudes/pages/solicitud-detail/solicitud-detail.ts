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
import { SolicitudTramite, RespuestaDepartamento } from '../../models/solicitud.model';
import { ESTADO_TRAMITE_LABELS, EstadoTramite } from '../../../../core/models';
import { RespuestaDialogComponent } from '../../components/respuesta-dialog/respuesta-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  solicitud = signal<SolicitudTramite | null>(null);
  loading = signal(true);
  estadoLabels = ESTADO_TRAMITE_LABELS;

  get currentUserId() { return this.authService.currentUser()?.id; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadSolicitud(id);
  }

  loadSolicitud(id: string): void {
    this.solicitudesService.getById(id).subscribe({
      next: data => { this.solicitud.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/solicitudes']); }
    });
  }

  esMiTarea(resp: RespuestaDepartamento): boolean {
    return !!this.currentUserId && resp.funcionarioAsignadoId === this.currentUserId;
  }

  tiempoDesde(fecha: string | null): string {
    if (!fecha) return '';
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  liberar(resp: RespuestaDepartamento): void {
    const sol = this.solicitud();
    if (!sol) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Liberar tarea',
        message: '¿Liberar esta tarea? Otro funcionario podrá tomarla.',
        confirmText: 'Liberar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.solicitudesService.liberar(sol.id, { elementId: resp.elementId }).subscribe({
        next: () => {
          this.loadSolicitud(sol.id);
          this.notificationService.add({ title: 'Tarea liberada', message: 'Volvió a la bandeja del departamento', type: 'success' });
        }
      });
    });
  }

  openResponderDialog(resp: RespuestaDepartamento): void {
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

  getDepartamentosActualesLabel(sol: SolicitudTramite): string {
    const activos = sol.respuestasPorDepartamento.filter(r => !r.fechaRespuesta);
    if (!activos.length) return 'Finalizado';
    return activos.map(r => r.departamentoNombre).join(', ');
  }

  getEstadoLabel(estado: string): string {
    return ESTADO_TRAMITE_LABELS[estado as EstadoTramite] || estado;
  }

  getEstadoClass(estado: EstadoTramite): string {
    const classes: Record<EstadoTramite, string> = {
      PENDIENTE: 'estado-pendiente',
      EN_PROCESO: 'estado-proceso',
      CANCELADO: 'estado-cancelado',
      APROBADO: 'estado-aprobado',
      RECHAZADO: 'estado-rechazado'
    };
    return classes[estado];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
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

  goBack(): void {
    this.router.navigate(['/solicitudes']);
  }
}
