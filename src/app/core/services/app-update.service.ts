import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';

/**
 * Escucha actualizaciones del Service Worker y notifica al usuario con un snackbar.
 *
 * Cuando hay una nueva versión disponible, muestra "Hay una nueva versión disponible"
 * con un botón "Actualizar" que activa la versión nueva y recarga la app.
 *
 * El SwUpdate solo está habilitado en producción (ver app.config.ts → provideServiceWorker
 * con `enabled: !isDevMode()`), así que en desarrollo este servicio es no-op.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private inicializado = false;

  /** Llamado una vez desde el shell (MainLayout) para empezar a escuchar updates. */
  iniciar(): void {
    if (this.inicializado) return;
    this.inicializado = true;

    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => this.mostrarSnackbarActualizacion());
  }

  private mostrarSnackbarActualizacion(): void {
    const ref = this.snackBar.open(
      'Hay una nueva versión disponible',
      'Actualizar',
      { duration: 0 } // persistente hasta que el usuario actúe
    );
    ref.onAction().subscribe(() => this.activarYRecargar());
  }

  private async activarYRecargar(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } catch {
      // si falla, igual recargamos — la próxima carga tomará el SW nuevo
    }
    window.location.reload();
  }
}
