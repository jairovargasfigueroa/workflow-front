export interface Tramite {
  id: string;
  nombre: string;
  descripcion: string;
  formularioSolicitanteId: string;
  flujoTrabajoId?: string;
  requisitos: string[];
  activo: boolean;
  fechaCreacion: string;
}

export interface TramiteRequest {
  nombre: string;
  descripcion?: string;
  formularioSolicitanteId?: string;
  flujoTrabajoId?: string;
  requisitos?: string[];
}
