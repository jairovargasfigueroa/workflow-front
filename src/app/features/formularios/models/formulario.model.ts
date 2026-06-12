import { TipoCampo } from '../../../core/models';

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido: boolean;
  /** SELECT / RADIO / CHECKBOX → las opciones a elegir. */
  opciones?: string[];
  /** TABLA → columnas de la tabla · GRID → opciones que elige cada fila. */
  columnas?: string[];
  /** GRID → las filas de la matriz. */
  filas?: string[];
}

export interface FormularioTemplate {
  id: string;
  titulo: string;
  descripcion: string;
  campos: CampoFormulario[];
  activo: boolean;
  fechaCreacion: string;
}

export interface FormularioTemplateRequest {
  titulo: string;
  descripcion?: string;
  campos: CampoFormulario[];
}
