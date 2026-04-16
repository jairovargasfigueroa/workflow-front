export interface CuelloDeBottella {
  departamentoId: string;
  nombre: string;
  promedioHoras: number;
  importanciaModelo: number; // 0 a 1
}

export interface Recomendacion {
  departamentoId: string;
  nombreDepartamento: string;
  mensaje: string;
}

export interface AnalyticsResponse {
  tramiteId: string;
  nombreTramite: string;
  cuellosDeBottella: CuelloDeBottella[];
  recomendaciones: Recomendacion[];
}

export interface TramiteOpcion {
  id: string;
  nombre: string;
}
