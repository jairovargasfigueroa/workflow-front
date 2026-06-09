import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { MotorService } from '../../../../core/services/motor.service';
import { Anomalia, AnomaliasFiltros, Severidad } from '../../../../core/models/motor';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { AnomaliaCardComponent } from '../../../../shared/components/ui/anomalia-card/anomalia-card';
import { MotorNoDisponibleComponent } from '../../../../shared/components/ui/motor-no-disponible/motor-no-disponible';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';

type FiltroChip = 'TODAS' | Severidad;

@Component({
  selector: 'app-anomalias-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    AnomaliaCardComponent,
    MotorNoDisponibleComponent,
    PageHeaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './anomalias-list.html',
  styleUrl: './anomalias-list.scss'
})
export class AnomaliasListComponent implements OnInit {
  private readonly motorService = inject(MotorService);
  private readonly notification = inject(NotificationService);
  private readonly matDialog = inject(MatDialog);

  readonly anomalias = signal<Anomalia[]>([]);
  readonly cargando = signal(true);
  readonly disponible = signal(true);
  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly pageSize = signal(20);
  readonly filtro = signal<FiltroChip>('TODAS');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const filtros: AnomaliasFiltros = {
      page: this.pagina(),
      size: this.pageSize()
    };
    if (this.filtro() !== 'TODAS') filtros.severidad = this.filtro() as Severidad;

    this.motorService.getAnomalias(filtros).subscribe(res => {
      this.disponible.set(res.disponible);
      this.anomalias.set(res.contenido ?? []);
      this.total.set(res.total ?? 0);
      this.cargando.set(false);
    });
  }

  setFiltro(f: FiltroChip): void {
    if (f === this.filtro()) return;
    this.filtro.set(f);
    this.pagina.set(0);
    this.cargar();
  }

  onPage(event: PageEvent): void {
    this.pagina.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargar();
  }

  async onDescartar(anomalia: Anomalia): Promise<void> {
    const confirmado = await firstValueFrom(
      this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: '¿Marcar como falso positivo?',
          message: 'La anomalía se descartará y el motor usará tu feedback para mejorar. No volverá a aparecer en el listado.',
          confirmText: 'Marcar',
          cancelText: 'Cancelar'
        }
      }).afterClosed()
    );
    if (!confirmado) return;

    this.motorService.descartarAnomalia(anomalia.id).subscribe({
      next: () => {
        // Sacamos localmente y recargamos en segundo plano para refrescar total/paginación.
        this.anomalias.update(list => list.filter(a => a.id !== anomalia.id));
        this.notification.add({
          title: 'Anomalía descartada',
          message: 'El motor lo registró como feedback.',
          type: 'success'
        });
        this.cargar();
      },
      error: () => {
        this.notification.add({
          title: 'No se pudo descartar',
          message: 'Reintentá en unos segundos.',
          type: 'error'
        });
      }
    });
  }
}
