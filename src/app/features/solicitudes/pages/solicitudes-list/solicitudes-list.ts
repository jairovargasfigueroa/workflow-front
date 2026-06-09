import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';

import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudTramiteResumen } from '../../models/solicitud.model';
import { SolicitudDialogComponent } from '../../components/solicitud-dialog/solicitud-dialog';
import { RespuestaDialogComponent } from '../../components/respuesta-dialog/respuesta-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { SlaBadgeComponent } from '../../../../shared/components/ui/sla-badge/sla-badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ESTADO_TRAMITE_LABELS, EstadoTramite } from '../../../../core/models';
import { formatFechaAbsoluta, formatTiempoRestante } from '../../../../core/utils/sla.util';

type FiltroSla = 'todos' | 'critico' | 'a-vencer';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    EmptyStateComponent,
    PageHeaderComponent,
    SlaBadgeComponent
  ],
  templateUrl: './solicitudes-list.html',
  styleUrl: './solicitudes-list.scss'
})
export class SolicitudesListComponent implements OnInit, OnDestroy {
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  bandejaDepto = signal<SolicitudTramiteResumen[]>([]);
  misTareas = signal<SolicitudTramiteResumen[]>([]);
  historialDepto = signal<SolicitudTramiteResumen[]>([]);

  loadingBandeja = signal(true);
  loadingMisTareas = signal(true);
  loadingHistorial = signal(false);

  // Tick que se incrementa cada 60s para que las celdas "Vence en X" se recalculen
  // sin volver a llamar al endpoint.
  readonly tick = signal(0);

  readonly filtroSla = signal<FiltroSla>('todos');

  columnasBandeja = ['urgencia', 'tramite', 'solicitante', 'sla', 'vence', 'fecha', 'acciones'];
  columnasMisTareas = ['tramite', 'solicitante', 'sla', 'vence', 'fecha', 'acciones'];
  columnasHistorial = ['tramite', 'solicitante', 'estado', 'sla', 'fecha', 'acciones'];

  estadoLabels = ESTADO_TRAMITE_LABELS;

  readonly bandejaFiltrada = computed(() => this.aplicarFiltroSla(this.bandejaDepto()));
  readonly misTareasFiltradas = computed(() => this.aplicarFiltroSla(this.misTareas()));
  readonly historialFiltrado = computed(() => this.aplicarFiltroSla(this.historialDepto()));

  private pollInterval?: ReturnType<typeof setInterval>;
  private tickInterval?: ReturnType<typeof setInterval>;
  historialCargado = false;

  get currentUser() { return this.authService.currentUser(); }

  ngOnInit(): void {
    this.loadBandeja();
    this.loadMisTareas();
    this.pollInterval = setInterval(() => {
      this.loadBandeja();
      this.loadMisTareas();
    }, 30000);
    // Recalcular "Vence en X" en vivo (local — sin pegarle al endpoint).
    this.tickInterval = setInterval(() => this.tick.update(t => t + 1), 60000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    clearInterval(this.tickInterval);
  }

  setFiltroSla(filtro: FiltroSla): void {
    this.filtroSla.set(filtro);
  }

  private aplicarFiltroSla(lista: SolicitudTramiteResumen[]): SolicitudTramiteResumen[] {
    const f = this.filtroSla();
    if (f === 'todos') return lista;
    if (f === 'critico') {
      return lista.filter(s => s.estadoSla === 'ROJO' || s.estadoSla === 'VENCIDO');
    }
    return lista.filter(s => s.estadoSla === 'AMARILLO' || s.estadoSla === 'ROJO' || s.estadoSla === 'VENCIDO');
  }

  /** Llamado desde el template para que la celda recalcule cada vez que cambia `tick`. */
  venceEn(sol: SolicitudTramiteResumen): string {
    this.tick(); // crea dependencia con el tick para forzar re-evaluación
    return formatTiempoRestante(sol.fechaLimite);
  }

  tooltipFechaLimite(sol: SolicitudTramiteResumen): string {
    const f = formatFechaAbsoluta(sol.fechaLimite);
    return f ? `Vence el ${f}` : '';
  }

  loadBandeja(): void {
    this.loadingBandeja.set(true);
    this.solicitudesService.getBandejaDepartamento().subscribe({
      next: d => { this.bandejaDepto.set(d); this.loadingBandeja.set(false); },
      error: () => this.loadingBandeja.set(false)
    });
  }

  loadMisTareas(): void {
    this.loadingMisTareas.set(true);
    this.solicitudesService.getMisTareas().subscribe({
      next: d => { this.misTareas.set(d); this.loadingMisTareas.set(false); },
      error: () => this.loadingMisTareas.set(false)
    });
  }

  loadHistorial(): void {
    this.loadingHistorial.set(true);
    this.solicitudesService.getHistorialDepartamento().subscribe({
      next: d => {
        this.historialDepto.set(d);
        this.loadingHistorial.set(false);
        this.historialCargado = true;
      },
      error: () => this.loadingHistorial.set(false)
    });
  }

  onTabChange(index: number): void {
    if (index === 0) this.loadBandeja();
    else if (index === 1) this.loadMisTareas();
    else if (index === 2 && !this.historialCargado) this.loadHistorial();
  }

  tomar(sol: SolicitudTramiteResumen): void {
    const deptId = this.currentUser?.departamentoId;
    if (!deptId) return;

    this.solicitudesService.getTareasActivas(sol.id, deptId).subscribe({
      next: tareas => {
        const tarea = tareas[0];
        if (!tarea) return;

        this.bandejaDepto.update(list => list.filter(s => s.id !== sol.id));

        this.solicitudesService.tomar(sol.id, { elementId: tarea.elementId }).subscribe({
          next: () => {
            this.loadMisTareas();
            this.notificationService.add({ title: 'Tarea tomada', message: 'Aparece ahora en "Mis tareas"', type: 'success' });
          },
          error: () => {
            this.bandejaDepto.update(list => [sol, ...list]);
          }
        });
      }
    });
  }

  liberarDesdeList(sol: SolicitudTramiteResumen): void {
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
      const deptId = this.currentUser?.departamentoId;
      if (!deptId) return;

      this.solicitudesService.getTareasActivas(sol.id, deptId).subscribe({
        next: tareas => {
          const tarea = tareas[0];
          if (!tarea) return;

          this.solicitudesService.liberar(sol.id, { elementId: tarea.elementId }).subscribe({
            next: () => {
              this.misTareas.update(list => list.filter(s => s.id !== sol.id));
              this.loadBandeja();
              this.notificationService.add({ title: 'Tarea liberada', message: 'Volvió a la bandeja del departamento', type: 'success' });
            }
          });
        }
      });
    });
  }

  async responderDesdeList(sol: SolicitudTramiteResumen): Promise<void> {
    const fullSolicitud = await firstValueFrom(this.solicitudesService.getById(sol.id));
    const dialogRef = this.dialog.open(RespuestaDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { solicitud: fullSolicitud }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMisTareas();
        this.loadBandeja();
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SolicitudDialogComponent, {
      width: '700px',
      maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBandeja();
    });
  }

  verDetalle(sol: SolicitudTramiteResumen): void {
    this.router.navigate(['/solicitudes', sol.id]);
  }

  getEstadoLabel(estado: EstadoTramite): string {
    return ESTADO_TRAMITE_LABELS[estado];
  }

  getUrgencyColor(fechaEntrada: string | null | undefined): string {
    if (!fechaEntrada) return 'urgency-gris';
    const horas = (Date.now() - new Date(fechaEntrada).getTime()) / (1000 * 60 * 60);
    if (horas < 24) return 'urgency-verde';
    if (horas < 48) return 'urgency-amarillo';
    return 'urgency-rojo';
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
}
