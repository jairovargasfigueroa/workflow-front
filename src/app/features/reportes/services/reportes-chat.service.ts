import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { EventoSSE } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /**
   * Abre un stream SSE al backend con el mensaje del usuario y devuelve un Observable
   * de eventos. Cuando el backend envía `{ tipo: 'fin' }` o `{ tipo: 'error' }`, el
   * Observable se completa. Cancelar la subscripción aborta la request.
   *
   * NO se puede usar EventSource porque no soporta headers (necesitamos Authorization).
   */
  enviarMensaje(sesionId: string, mensaje: string): Observable<EventoSSE> {
    return new Observable<EventoSSE>(subscriber => {
      const controller = new AbortController();
      const token = this.authService.getToken();

      const url = `${environment.apiUrl}/reportes/chat`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sesionId, mensaje }),
        signal: controller.signal
      })
        .then(async response => {
          if (!response.ok) {
            subscriber.next({
              tipo: 'error',
              mensaje: this.mapearErrorHttp(response.status)
            });
            subscriber.complete();
            return;
          }
          if (!response.body) {
            subscriber.next({ tipo: 'error', mensaje: 'El servidor no devolvió cuerpo de respuesta.' });
            subscriber.complete();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let chunksRecibidos = 0;
          let eventosEmitidos = 0;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              chunksRecibidos++;
              console.debug('[SSE chunk #' + chunksRecibidos + ']', JSON.stringify(chunk));
              buffer += chunk;

              // SSE separa eventos por línea en blanco. Toleramos \n\n y \r\n\r\n.
              const normalizado = buffer.replace(/\r\n/g, '\n');
              const partes = normalizado.split('\n\n');
              buffer = partes.pop() ?? '';

              for (const parte of partes) {
                if (!parte.trim()) continue;
                const evento = this.parsearEventoSSE(parte);
                if (!evento) {
                  console.warn('[SSE] No se pudo parsear el bloque:', parte);
                  continue;
                }
                eventosEmitidos++;
                console.debug('[SSE evento #' + eventosEmitidos + ']', evento);
                subscriber.next(evento);
                if (evento.tipo === 'fin' || evento.tipo === 'error') {
                  subscriber.complete();
                  return;
                }
              }
            }
            // El stream terminó sin un 'fin' explícito.
            console.debug(
              '[SSE] Stream completo. Chunks:', chunksRecibidos,
              '| Eventos:', eventosEmitidos,
              '| Buffer residual:', JSON.stringify(buffer)
            );
            if (eventosEmitidos === 0) {
              subscriber.next({
                tipo: 'error',
                mensaje: 'El servidor cerró la conexión sin enviar datos.'
              });
            }
            subscriber.complete();
          } catch (err: unknown) {
            if ((err as Error)?.name === 'AbortError') {
              subscriber.complete();
              return;
            }
            subscriber.next({
              tipo: 'error',
              mensaje: 'Se interrumpió la conexión con el servidor.'
            });
            subscriber.complete();
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') {
            subscriber.complete();
            return;
          }
          subscriber.next({
            tipo: 'error',
            mensaje: 'No se pudo contactar al servidor.'
          });
          subscriber.complete();
        });

      // Teardown — cancelar la request si el componente se destruye o cierra el stream.
      return () => controller.abort();
    });
  }

  /**
   * Parsea un bloque SSE. Tolera:
   *   - "data: {json}"
   *   - "data:{json}" (sin espacio)
   *   - "data: a\ndata: b" (concatena varias líneas)
   *   - bloque sin prefijo "data:" pero con JSON válido (fallback)
   * Ignora líneas que empiezan con ':' (comentarios SSE) y "event:"/"id:"/"retry:".
   */
  private parsearEventoSSE(bloque: string): EventoSSE | null {
    const lineas = bloque.split('\n');
    const dataLineas: string[] = [];

    for (const linea of lineas) {
      if (!linea || linea.startsWith(':')) continue; // comentario o vacío
      if (linea.startsWith('data:')) {
        dataLineas.push(linea.slice(5).replace(/^ /, ''));
      }
    }

    const json = dataLineas.length > 0 ? dataLineas.join('\n') : bloque.trim();
    if (!json) return null;

    try {
      return JSON.parse(json) as EventoSSE;
    } catch {
      return null;
    }
  }

  private mapearErrorHttp(status: number): string {
    if (status === 401) return 'Tu sesión expiró. Por favor iniciá sesión nuevamente.';
    if (status === 403) return 'No tenés permiso para usar esta funcionalidad.';
    if (status === 404) return 'El endpoint del chat no está disponible.';
    if (status >= 500) return 'Error del servidor. Reintentá en unos segundos.';
    return `Error ${status} al contactar el servidor.`;
  }

  /**
   * Descarga un archivo generado por el agente.
   * La url del evento puede venir de dos formas:
   *   - Relativa al apiUrl: "/reportes/descargar/abc"
   *   - Ya con el /api/ incluido: "/api/reportes/descargar/abc"
   * Detectamos y componemos la URL final sin duplicar el segmento /api.
   * Usamos HttpClient para que el interceptor agregue el JWT y recibir blob.
   */
  descargarArchivo(urlRelativa: string, nombre: string): Observable<void> {
    return new Observable<void>(subscriber => {
      const fullUrl = this.componerUrlDescarga(urlRelativa);
      const sub = this.http.get(fullUrl, { responseType: 'blob' }).subscribe({
        next: blob => {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = nombre;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(objectUrl);
          subscriber.next();
          subscriber.complete();
        },
        error: err => subscriber.error(err)
      });
      return () => sub.unsubscribe();
    });
  }

  /**
   * Compone la URL absoluta de descarga sin duplicar el segmento /api.
   *  - Si la url ya empieza con /api/ → usar host base (apiUrl sin /api).
   *  - Si es una URL absoluta http(s) → usarla tal cual.
   *  - Si es relativa al apiUrl → prefijar con apiUrl.
   */
  private componerUrlDescarga(urlRelativa: string): string {
    if (/^https?:\/\//i.test(urlRelativa)) return urlRelativa;

    const apiUrl = environment.apiUrl.replace(/\/$/, '');
    const baseUrl = apiUrl.replace(/\/api$/, '');

    if (urlRelativa.startsWith('/api/')) {
      return `${baseUrl}${urlRelativa}`;
    }
    return `${apiUrl}${urlRelativa.startsWith('/') ? '' : '/'}${urlRelativa}`;
  }
}
