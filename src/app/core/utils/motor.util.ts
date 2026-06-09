import { Prioridad, Severidad } from '../models/motor';

/**
 * Mapea severidad / prioridad a las clases CSS de color que ya existen
 * en _tokens.scss (reusamos las del refactor SLA para coherencia visual).
 *
 *   CRITICA / ALTA  → tokens "sla-rojo"
 *   MEDIA           → tokens "sla-amarillo"
 *   BAJA            → tokens "sla-null"
 */
export function claseSeveridad(s: Severidad | null | undefined): string {
  if (s === 'CRITICA') return 'severidad-critica';
  if (s === 'MEDIA') return 'severidad-media';
  if (s === 'BAJA') return 'severidad-baja';
  return 'severidad-null';
}

export function clasePrioridad(p: Prioridad | null | undefined): string {
  if (p === 'ALTA') return 'severidad-critica';   // misma escala visual
  if (p === 'MEDIA') return 'severidad-media';
  if (p === 'BAJA') return 'severidad-baja';
  return 'severidad-null';
}

/** Score 0-1 → "0.94" con 2 decimales. */
export function formatScore(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return '—';
  return score.toFixed(2);
}

/** Probabilidad 0-1 → "78%". */
export function formatProbabilidad(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—';
  return `${Math.round(p * 100)}%`;
}

/** Porcentaje 0-100 → "45%". */
export function formatPorcentaje(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—';
  return `${Math.round(p)}%`;
}
