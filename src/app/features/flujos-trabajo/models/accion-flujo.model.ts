/**
 * Catálogo de acciones válidas para las flechas del editor de flujos.
 * Lo expone el backend en GET /api/catalogo/acciones-flujo.
 *
 * - etiqueta: lo que se escribe como `name` en el BPMN (capitalizado, ej "Aprobado").
 * - valor: la versión normalizada que usa el back internamente (ej "aprobado").
 * - esFinal: si true, la acción sirve para un EndEvent (define el estado final).
 * - estadoFinal: a qué estado del trámite mapea (solo en las finales).
 */
export interface AccionFlujo {
  etiqueta: string;
  valor: string;
  esFinal: boolean;
  estadoFinal?: string | null;
}
