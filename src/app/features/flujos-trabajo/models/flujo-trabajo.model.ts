export type EstadoFlujo = 'SIN_PUBLICAR' | 'ACTIVO' | 'DESACTIVADO' | 'ARCHIVADO';

export const ESTADO_FLUJO_LABELS: Record<EstadoFlujo, string> = {
  SIN_PUBLICAR: 'Sin publicar',
  ACTIVO: 'Activo',
  DESACTIVADO: 'Desactivado',
  ARCHIVADO: 'Archivado'
};

export interface FlujoTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  procesoKey: string;
  estadoFlujo: EstadoFlujo;
  tieneBorrador: boolean;
  borradorActualizacion: string | null;
  versionActualNumero: number | null;
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface FlujoTrabajoRequest {
  nombre: string;
  descripcion?: string;
  creadoPor?: string;
}


export interface FlujoVersion {
  id: string;
  numero: number;
  fechaCreacion: string;
  creadoPor: string;
}

export interface FlujoVersionDetalle extends FlujoVersion {
  xml: string;
}

export interface BorradorRequest {
  xml: string;
}

export interface PublicarRequest {
  comentario?: string;
}

export interface PublicarErrorResponse {
  errores: string[];
}

export interface EstadoFlujoRequest {
  estado: EstadoFlujo;
}

export interface CopiarVersionRequest {
  numeroVersion: number;
}
