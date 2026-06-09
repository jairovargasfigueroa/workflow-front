import { Criticidad } from '../../../core/models/sla';

export interface Tramite {
  id: string;
  nombre: string;
  descripcion: string;
  formularioSolicitanteId: string;
  flujoTrabajoId?: string;
  requisitos: string[];
  etiquetas?: string[];
  activo: boolean;
  fechaCreacion: string;
  plazoObjetivoHoras?: number | null;
  plazoMaximoHoras?: number | null;
  umbralAlertaPorcentaje?: number | null;
  criticidad?: Criticidad | null;
}

export interface TramiteRequest {
  nombre: string;
  descripcion?: string;
  formularioSolicitanteId?: string;
  flujoTrabajoId?: string;
  requisitos?: string[];
  etiquetas?: string[];
  plazoObjetivoHoras?: number | null;
  plazoMaximoHoras?: number | null;
  umbralAlertaPorcentaje?: number | null;
  criticidad?: Criticidad | null;
}
