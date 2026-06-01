import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae el mensaje de error que envía el backend en su body.
 * Convención del backend: { "error": "mensaje" }.
 * Mantenemos un fallback a `message` por compatibilidad con otros endpoints.
 */
export function extractBackendErrorMessage(err: HttpErrorResponse): string | null {
  const body = err?.error;
  if (!body) return null;
  if (typeof body === 'string') return body;
  return body.error ?? body.message ?? null;
}

/**
 * Mapea un HttpErrorResponse a un mensaje user-friendly en español.
 * Si el backend envió un mensaje propio, lo prioriza sobre el genérico.
 */
export function mapHttpErrorToUserMessage(err: HttpErrorResponse): string {
  const backendMsg = extractBackendErrorMessage(err);

  if (err.status === 0) return 'No se pudo contactar al servidor.';
  if (err.status === 413) return 'El archivo es demasiado grande. Máximo: 50 MB.';
  if (err.status === 403) return backendMsg || 'No tienes permiso para esta acción.';
  if (err.status === 404) return backendMsg || 'Recurso no encontrado.';
  if (err.status === 400) return backendMsg || 'Solicitud inválida.';
  if (err.status >= 500) return backendMsg || 'Error del servidor. Reintenta.';

  return backendMsg || 'Ocurrió un error inesperado.';
}
