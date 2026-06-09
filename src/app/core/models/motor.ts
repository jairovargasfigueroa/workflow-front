// Convenciones de escala:
//   cumplimientoSlaPorcentaje / cumplimientoSlaEsperado → 0-100
//   score / probabilidad                                → 0-1

import { EstadoSla } from './sla';

export type Severidad = 'CRITICA' | 'MEDIA' | 'BAJA';
export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
export type TipoAnomalia = 'solicitud_estancada' | 'usuario_sospechoso' | 'tramite_anormal' | string;

export const SEVERIDAD_LABELS: Record<Severidad, string> = {
  CRITICA: 'Crítica',
  MEDIA: 'Media',
  BAJA: 'Baja'
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
};

// ============ Mejor Ruta ============

export interface RutaPredicha {
  nombre: string;
  nodos: string[];
  tiempoPredichoHoras: number;
  cumplimientoSlaPorcentaje: number;     // 0-100
  recomendada: boolean;
}

export interface MejorRutaResponse {
  flujoId: string;
  rutas: RutaPredicha[];
  rutaRecomendadaNombre: string | null;
  disponible: boolean;
}

// ============ Riesgo ============

export interface CuelloPredicho {
  nodoNombre: string;
  departamentoId: string;
  probabilidad: number;                  // 0-1
  cuando: string;
}

export interface DemoraPredicha {
  tipo: string;
  impacto: string;
  probabilidad: number;                  // 0-1
}

export interface RiesgoResponse {
  flujoId: string;
  cuellosPredichos: CuelloPredicho[];
  demorasPredichas: DemoraPredicha[];
  cumplimientoSlaEsperado: number | null; // 0-100
  disponible: boolean;
}

// ============ Anomalías ============

export interface Anomalia {
  id: string;
  tipo: TipoAnomalia;
  severidad: Severidad;
  descripcion: string;
  score: number;                          // 0-1
  detectada: string;                      // ISO datetime
  contextoSla: string | null;
  solicitudIdAfectada: string | null;
  usuarioIdAfectado: string | null;
}

export interface AnomaliasPagedResponse {
  contenido: Anomalia[];
  total: number;
  pagina: number;
  totalPaginas: number;
  disponible: boolean;
}

export interface AnomaliasFiltros {
  page?: number;
  size?: number;
  severidad?: Severidad;
}

// ============ Dashboard Prioridad ============

export interface TopUrgente {
  solicitudId: string;
  tramiteNombre: string;
  prioridad: Prioridad;
  razon: string;
  score: number;                          // 0-1
  // Bonus opcionales que enriquecen la fila — el back los provee, no son obligatorios.
  estadoSla?: EstadoSla | null;
  horasHastaLimite?: number | null;
}

export interface DashboardPrioridadResponse {
  totalConPrioridadAlta: number;
  totalConPrioridadMedia: number;
  totalConPrioridadBaja: number;
  topUrgentes: TopUrgente[];
  disponible: boolean;
}
