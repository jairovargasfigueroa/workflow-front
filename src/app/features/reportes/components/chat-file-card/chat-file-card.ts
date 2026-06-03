import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArchivoAdjunto, TipoArchivoGenerado } from '../../models/chat.model';
import { ReportesChatService } from '../../services/reportes-chat.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-chat-file-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './chat-file-card.html',
  styleUrl: './chat-file-card.scss'
})
export class ChatFileCardComponent {
  @Input({ required: true }) archivo!: ArchivoAdjunto;

  private readonly chatService = inject(ReportesChatService);
  private readonly notification = inject(NotificationService);

  readonly descargando = signal(false);

  iconoTipo(): string {
    const iconos: Record<TipoArchivoGenerado, string> = {
      xlsx: 'table_chart',
      pdf: 'picture_as_pdf',
      docx: 'description'
    };
    return iconos[this.archivo.tipoArchivo] ?? 'insert_drive_file';
  }

  claseTipo(): string {
    return `file-card--${this.archivo.tipoArchivo}`;
  }

  etiquetaTipo(): string {
    return this.archivo.tipoArchivo.toUpperCase();
  }

  descargar(): void {
    if (this.descargando()) return;
    this.descargando.set(true);
    this.chatService.descargarArchivo(this.archivo.url, this.archivo.nombre).subscribe({
      next: () => this.descargando.set(false),
      error: (err: HttpErrorResponse) => {
        this.descargando.set(false);
        this.notification.add({
          title: 'Error al descargar',
          message: mapHttpErrorToUserMessage(err),
          type: 'error'
        });
      }
    });
  }
}
