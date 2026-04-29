export interface FlujoAnalytics {
  flujoId: string;
  flujoNombre: string;
  puntajeSalud: number;
  totalSolicitudes: number;
}

export interface FlujosListResponse {
  flujos: FlujoAnalytics[];
}

export interface RespuestaEntrenamiento {
  r2_score: number;
  solicitudes_usadas: number;
  nombre_modelo: string;
}

export interface DiagnosticoFlujo {
  puntajeSalud: number;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  tiempoEstimadoDias: number;
  resumen: string;
}

export interface CuelloBottella {
  elementId: string;
  nombre: string;
  tiempoEstimadoHoras: number;
  razon: string;
  sugerencia: string | null;
}

export interface Optimizacion {
  tipo: 'PARALELIZAR' | 'REDUCIR_FORMULARIO' | 'REVISAR_GATEWAY';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  descripcion: string;
  accion: string;
  elementosAfectados: string[];
  impactoEstimado: string | null;
}

export interface OptimizarResponse {
  flujoId: string;
  flujoNombre: string;
  diagnostico: DiagnosticoFlujo;
  cuellos: CuelloBottella[];
  optimizaciones: Optimizacion[];
}
