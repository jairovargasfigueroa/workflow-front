import { EstadoTramite } from '../../../core/models';
import { CampoFormulario } from '../../formularios/models/formulario.model';

export interface SolicitudTramiteResumen {
  id: string;
  tramiteId: string;
  tramiteNombre: string;
  solicitanteId: string;
  solicitanteNombre: string;
  estado: EstadoTramite;
  departamentosActuales: string[];
  fechaCreacion: string;
  fechaFinalizacion: string | null;
  fechaEntradaDepartamentoActual?: string | null;
}

export interface RespuestaCampo {
  nombreCampo: string;
  valor: string;
}

export interface RespuestaDepartamento {
  departamentoId: string;
  departamentoNombre: string;
  elementId: string;
  formularioId: string;
  funcionarioId: string | null;
  funcionarioNombre: string | null;
  accion: string | null;
  comentario: string | null;
  fechaEntrada: string;
  fechaRespuesta: string | null;
  respuestas: RespuestaCampo[];
  funcionarioAsignadoId: string | null;
  funcionarioAsignadoNombre: string | null;
  fechaAsignacion: string | null;
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
  tramiteNombre: string;
  solicitanteId: string;
  solicitanteNombre: string;
  estado: EstadoTramite;
  departamentosActuales: string[];
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaFinalizacion: string | null;
  respuestasSolicitante: RespuestaCampo[];
  respuestasPorDepartamento: RespuestaDepartamento[];
  adjuntos: Adjunto[];
}

export interface SolicitudTramiteRequest {
  tramiteId: string;
  respuestas: RespuestaCampo[];
  adjuntos?: Adjunto[];
}

export interface AccionDisponible {
  etiqueta: string | null;
  valor: string;
}

export interface TareaActiva {
  elementId: string;
  departamentoId: string;
  departamentoNombre: string;
  campos: CampoFormulario[];
  acciones: AccionDisponible[];
}

export interface RespuestaDepartamentoRequest {
  departamentoId: string;
  elementId: string;
  accion: string;
  comentario?: string;
  respuestas: RespuestaCampo[];
}

export interface TomarLiberarRequest {
  elementId: string;
}
