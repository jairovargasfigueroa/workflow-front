/**
 * Utilidades para mostrar plazos SLA y tiempo restante.
 * Convenciones del proyecto:
 *  - Adaptativo: "3 días" / "3d 6h" / "6h 30m" / "45 min" / "Vencida hace 2h"
 *  - Sin fechaLimite → '—'
 */

/**
 * Devuelve una cadena legible para mostrar en "Vence en X" o "Vencida hace X".
 * Si la fecha es null o inválida, retorna '—'.
 */
export function formatTiempoRestante(fechaLimite: string | null | undefined): string {
  if (!fechaLimite) return '—';
  const t = new Date(fechaLimite).getTime();
  if (Number.isNaN(t)) return '—';

  const diff = t - Date.now();
  if (diff < 0) return `Vencida hace ${formatDuracion(-diff)}`;
  return formatDuracion(diff);
}

/**
 * Formatea una duración en ms a cadena adaptativa.
 *   > 1 día  → "3 días" o "3d 6h" (solo agregamos horas si > 2)
 *   >= 1 h   → "6 horas" o "5h 30m"
 *   < 1 h    → "45 min" (mínimo 1 min)
 */
export function formatDuracion(ms: number): string {
  if (ms < 0) return '0 min';
  const totalMin = Math.floor(ms / 60000);
  const totalHoras = Math.floor(totalMin / 60);
  const dias = Math.floor(totalHoras / 24);

  if (dias >= 1) {
    const horasRem = totalHoras - dias * 24;
    if (horasRem > 2) return `${dias}d ${horasRem}h`;
    return dias === 1 ? '1 día' : `${dias} días`;
  }
  if (totalHoras >= 1) {
    const minRem = totalMin - totalHoras * 60;
    if (minRem > 0) return `${totalHoras}h ${minRem}m`;
    return totalHoras === 1 ? '1 hora' : `${totalHoras} horas`;
  }
  return `${Math.max(1, totalMin)} min`;
}

/**
 * Formatea un plazo en horas a cadena legible: 24 → "1 día", 168 → "7 días", 6 → "6 horas".
 */
export function formatPlazoHoras(horas: number | null | undefined): string {
  if (horas == null || horas <= 0) return '—';
  if (horas % 24 === 0) {
    const dias = horas / 24;
    return dias === 1 ? '1 día' : `${dias} días`;
  }
  return horas === 1 ? '1 hora' : `${horas} horas`;
}

/**
 * Formato absoluto para tooltip — "08/06/2026 a las 18:00".
 */
export function formatFechaAbsoluta(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const fechaStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${fechaStr} a las ${horaStr}`;
}

/**
 * Porcentaje consumido del SLA — útil para barra de progreso del detalle.
 * @returns número entre 0 y 100 (o > 100 si está vencido), o null si faltan datos.
 */
export function porcentajeSlaConsumido(
  fechaInicio: string | null | undefined,
  fechaLimite: string | null | undefined
): number | null {
  if (!fechaInicio || !fechaLimite) return null;
  const inicio = new Date(fechaInicio).getTime();
  const limite = new Date(fechaLimite).getTime();
  if (Number.isNaN(inicio) || Number.isNaN(limite) || limite <= inicio) return null;
  const total = limite - inicio;
  const consumido = Date.now() - inicio;
  return Math.max(0, Math.round((consumido / total) * 100));
}
