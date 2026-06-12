import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';

import { AuditoriaArchivosService } from '../../services/auditoria-archivos.service';
import {
  EventoAuditoriaResponse,
  TIPO_EVENTO_AUDITORIA_LABELS,
  TipoEventoAuditoria
} from '../../models/archivo.model';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

export interface ArchivoAuditoriaModalData {
  archivoId: string;
  nombreArchivo: string;
}

@Component({
  selector: 'app-archivo-auditoria-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  templateUrl: './archivo-auditoria-modal.html',
  styleUrl: './archivo-auditoria-modal.scss'
})
export class ArchivoAuditoriaModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ArchivoAuditoriaModalComponent>);
  private readonly data = inject<ArchivoAuditoriaModalData>(MAT_DIALOG_DATA);
  private readonly auditoriaService = inject(AuditoriaArchivosService);
  private readonly feedback = inject(FeedbackService);

  archivoId = this.data.archivoId;
  nombreArchivo = this.data.nombreArchivo;

  eventos: EventoAuditoriaResponse[] = [];
  loading = true;
  pageIndex = 0;
  pageSize = 20;
  total = 0;

  readonly tipoLabels = TIPO_EVENTO_AUDITORIA_LABELS;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.auditoriaService.buscar({
      archivoId: this.archivoId,
      page: this.pageIndex,
      size: this.pageSize
    }).subscribe({
      next: res => {
        this.eventos = res.contenido;
        this.total = res.totalElementos;
        this.loading = false;
      },
      error: err => {
        this.handleError(err, 'No se pudo cargar la auditoría');
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargar();
  }

  iconoTipo(tipo: TipoEventoAuditoria): string {
    const map: Record<TipoEventoAuditoria, string> = {
      UPLOAD: 'upload_file',
      DOWNLOAD: 'download',
      VIEW_METADATA: 'visibility',
      NEW_VERSION: 'history',
      REVERT: 'restore',
      DELETE: 'delete',
      ACCESS_DENIED: 'block'
    };
    return map[tipo] || 'event_note';
  }

  claseTipo(tipo: TipoEventoAuditoria): string {
    if (tipo === 'ACCESS_DENIED' || tipo === 'DELETE') return 'evento-warn';
    if (tipo === 'UPLOAD' || tipo === 'NEW_VERSION' || tipo === 'REVERT') return 'evento-info';
    return 'evento-neutral';
  }

  close(): void {
    this.dialogRef.close();
  }

  private handleError(err: HttpErrorResponse, _fallback: string): void {
    this.feedback.error(mapHttpErrorToUserMessage(err));
  }
}
