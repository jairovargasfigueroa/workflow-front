import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

/**
 * Feedback inmediato al usuario tras una acción (guardar, subir, eliminar, etc.).
 *
 * Muestra un snackbar (toast) abajo a la derecha por unos segundos.
 * NO reemplaza al `NotificationService` (el panel del header) — que sigue siendo
 * para notificaciones acumulables del backend. Este service es para retroalimentación
 * inmediata al ojo del usuario.
 *
 * Uso:
 *   feedback.success('Solicitud creada');
 *   feedback.error('No se pudo subir el archivo');
 *   feedback.info('Procesando...');
 *   feedback.warn('Faltan documentos obligatorios');
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly DURATION_DEFAULT = 3500;
  private readonly DURATION_ERROR = 5000;

  success(mensaje: string, duracion?: number): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion ?? this.DURATION_DEFAULT,
      panelClass: ['feedback-snackbar', 'feedback-success'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  error(mensaje: string, duracion?: number): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion ?? this.DURATION_ERROR,
      panelClass: ['feedback-snackbar', 'feedback-error'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  warn(mensaje: string, duracion?: number): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion ?? this.DURATION_DEFAULT,
      panelClass: ['feedback-snackbar', 'feedback-warn'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  info(mensaje: string, duracion?: number): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion ?? this.DURATION_DEFAULT,
      panelClass: ['feedback-snackbar', 'feedback-info'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
