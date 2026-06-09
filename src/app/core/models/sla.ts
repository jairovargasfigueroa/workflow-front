export type EstadoSla = 'VERDE' | 'AMARILLO' | 'ROJO' | 'VENCIDO';

export type Criticidad = 'RUTINARIO' | 'IMPORTANTE' | 'CRITICO' | 'EMERGENCIA';

export const ESTADO_SLA_LABELS: Record<EstadoSla, string> = {
  VERDE: 'En tiempo',
  AMARILLO: 'En riesgo',
  ROJO: 'Crítico',
  VENCIDO: 'Vencido'
};

export const CRITICIDAD_LABELS: Record<Criticidad, string> = {
  RUTINARIO: 'Rutinario',
  IMPORTANTE: 'Importante',
  CRITICO: 'Crítico',
  EMERGENCIA: 'Emergencia'
};

export const CRITICIDAD_ICONOS: Record<Criticidad, string> = {
  RUTINARIO: 'circle',
  IMPORTANTE: 'flag',
  CRITICO: 'priority_high',
  EMERGENCIA: 'crisis_alert'
};

/**
 * Mapea EstadoSla a la clase CSS que define color de fondo, texto y solid.
 * Las variables están definidas en _tokens.scss.
 */
export function claseEstadoSla(estado: EstadoSla | null | undefined): string {
  if (!estado) return 'sla-null';
  return `sla-${estado.toLowerCase()}`;
}

export function claseCriticidad(criticidad: Criticidad | null | undefined): string {
  if (!criticidad) return 'criticidad-rutinario';
  return `criticidad-${criticidad.toLowerCase()}`;
}
