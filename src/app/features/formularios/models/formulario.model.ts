import { TipoCampo } from '../../../core/models';

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];
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
