import { EstadoTramite } from '../../../core/models';

export interface RespuestaCampo {
  nombreCampo: string;
  valor: string;
}

export interface RespuestaDepartamento {
  departamentoId: string;
  formularioId: string;
  funcionarioId: string;
  fecha: string;
  respuestas: RespuestaCampo[];
}

export interface HistorialEstado {
  estado: string;
  departamentoId: string;
  funcionarioId: string;
  fechaEntrada?: string;
  fecha: string;
  comentario: string;
}

export interface Adjunto {
  nombre: string;
  url: string;
  tipo: string;
  fechaSubida?: string;
}

export interface SolicitudTramite {
  id: string;
  tramiteId: string;
  solicitanteId: string;
  estado: EstadoTramite;
  departamentoActualId: string | null;
  processInstanceId: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaFinalizacion?: string | null;
  respuestasSolicitante: RespuestaCampo[];
  respuestasPorDepartamento: RespuestaDepartamento[];
  historialEstados: HistorialEstado[];
  adjuntos: Adjunto[];
}

export interface SolicitudTramiteRequest {
  tramiteId: string;
  solicitanteId: string;
  respuestas: RespuestaCampo[];
  adjuntos?: Adjunto[];
}

export interface RespuestaDepartamentoRequest {
  departamentoId: string;
  formularioId: string;
  funcionarioId: string;
  accion: 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
  comentario?: string;
  respuestas: RespuestaCampo[];
}
