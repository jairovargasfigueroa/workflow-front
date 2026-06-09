import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly notificationService = inject(NotificationService);

  /** Identificador del input que está escuchando, o null si nadie escucha. */
  readonly escuchando = signal<string | null>(null);

  /** True si el navegador soporta Web Speech API (chequeo una sola vez). */
  readonly soportado: boolean = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  /** Referencia a la recognition activa para poder pararla a la fuerza. */
  private recognitionActiva: any | null = null;

  /**
   * Abre el reconocimiento de voz. Retorna un Observable que emite el transcript
   * y luego completa. Si el usuario llama listen() de nuevo con el mismo target,
   * se cancela la escucha actual.
   */
  listen(target: string): Observable<string> {
    return new Observable(observer => {
      if (!this.soportado) {
        this.notificationService.add({
          title: 'No disponible',
          message: 'Tu navegador no soporta reconocimiento de voz',
          type: 'error'
        });
        observer.complete();
        return;
      }

      // Toggle: si ya está escuchando ese mismo target, cancelamos.
      if (this.escuchando() === target) {
        this.stop();
        observer.complete();
        return;
      }

      // Si había otra escucha activa (de otro target), la cortamos antes.
      this.stop();

      const SpeechRecognition = (window as any).SpeechRecognition
                              || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;

      this.escuchando.set(target);
      this.recognitionActiva = recognition;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        observer.next(transcript);
        observer.complete();
        this.recognitionActiva = null;
        this.escuchando.set(null);
      };

      recognition.onerror = (event: any) => {
        this.recognitionActiva = null;
        this.escuchando.set(null);
        this.notificarError(event?.error);
        observer.complete();
      };

      recognition.onend = () => {
        this.recognitionActiva = null;
        this.escuchando.set(null);
      };

      recognition.start();
    });
  }

  /**
   * Detiene la escucha activa al instante. Si nada estaba escuchando, no hace nada.
   * Llamar desde ngOnDestroy o cuando el contexto del input deja de ser relevante
   * (ej. el chat de reportes empieza a procesar una respuesta).
   */
  stop(): void {
    if (this.recognitionActiva) {
      try {
        this.recognitionActiva.abort();
      } catch {
        // ignoramos errores del abort, ya estamos limpiando
      }
      this.recognitionActiva = null;
    }
    this.escuchando.set(null);
  }

  private notificarError(error: string | undefined): void {
    switch (error) {
      case 'not-allowed':
      case 'service-not-allowed':
        this.notificationService.add({
          title: 'Permiso denegado',
          message: 'Habilitá el micrófono desde la configuración del navegador.',
          type: 'error'
        });
        break;
      case 'audio-capture':
        this.notificationService.add({
          title: 'Sin micrófono',
          message: 'No se detectó ningún micrófono disponible.',
          type: 'error'
        });
        break;
      case 'no-speech':
      case 'aborted':
        // silencioso — no es un error de mostrar al usuario
        break;
      default:
        this.notificationService.add({
          title: 'Error de dictado',
          message: 'No se pudo procesar el audio. Reintentá.',
          type: 'error'
        });
    }
  }
}
