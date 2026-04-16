export interface FlujoTrabajo {
  id: string;
  nombre: string;
  descripcion: string;
  procesoKey: string;
  activo: boolean;
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface FlujoTrabajoRequest {
  nombre: string;
  descripcion?: string;
  procesoKey: string;
  creadoPor?: string;
}

export interface DesplegarRequest {
  xml: string;
}
