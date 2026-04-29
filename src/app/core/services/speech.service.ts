import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly notificationService = inject(NotificationService);

  escuchando = signal<string | null>(null);

  listen(target: string): Observable<string> {
    return new Observable(observer => {
      const SpeechRecognition = (window as any).SpeechRecognition
                              || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        this.notificationService.add({
          title: 'No disponible',
          message: 'Tu navegador no soporta reconocimiento de voz',
          type: 'error'
        });
        observer.complete();
        return;
      }

      if (this.escuchando() === target) {
        this.escuchando.set(null);
        observer.complete();
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;

      this.escuchando.set(target);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        observer.next(transcript);
        observer.complete();
        this.escuchando.set(null);
      };

      recognition.onerror = () => {
        this.escuchando.set(null);
        observer.complete();
      };

      recognition.onend = () => this.escuchando.set(null);

      recognition.start();
    });
  }
}
