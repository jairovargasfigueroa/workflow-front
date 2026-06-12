export type TipoSujetoPermiso =
  | 'ROL'
  | 'DEPARTAMENTO'
  | 'DUENO_TRAMITE'
  | 'DPTO_ORIGEN'
  | 'QUIEN_LO_SUBIO'
  | 'TODOS_SIGUIENTES_NODOS'
  | 'TODOS_AUTENTICADOS';

export const TIPO_SUJETO_PERMISO_LABELS: Record<TipoSujetoPermiso, string> = {
  ROL: 'Rol específico',
  DEPARTAMENTO: 'Departamento específico',
  DUENO_TRAMITE: 'Solicitante del trámite',
  DPTO_ORIGEN: 'Departamento de origen',
  QUIEN_LO_SUBIO: 'Quien lo subió',
  TODOS_SIGUIENTES_NODOS: 'Todos los siguientes nodos',
  TODOS_AUTENTICADOS: 'Todos los autenticados'
};

export const TIPO_SUJETO_PERMISO_DESCRIPCIONES: Record<TipoSujetoPermiso, string> = {
  ROL: 'Cualquier usuario con el rol seleccionado.',
  DEPARTAMENTO: 'Funcionarios del departamento seleccionado.',
  DUENO_TRAMITE: 'El solicitante que creó el trámite.',
  DPTO_ORIGEN: 'El departamento que generó el archivo.',
  QUIEN_LO_SUBIO: 'El usuario específico que subió el archivo.',
  TODOS_SIGUIENTES_NODOS: 'Funcionarios de nodos posteriores en el flujo.',
  TODOS_AUTENTICADOS: 'Cualquier usuario logueado en el sistema.'
};

export interface SujetoPermiso {
  tipo: TipoSujetoPermiso;
  sujetoId: string | null;
}

export interface PermisoSet {
  subidores: SujetoPermiso[];
  lectores: SujetoPermiso[];
  editores: SujetoPermiso[];
  eliminadores: SujetoPermiso[];
}

export interface DocumentoConfig {
  nombre: string;
  formatosAceptados: string[];
  obligatorio: boolean;
  permisos: PermisoSet;
  inmutablePostCierre: boolean;
}

export interface ConfiguracionDocumental {
  documentosProducidos: DocumentoConfig[];
  permisosDefaultAdHoc: PermisoSet;
}

export function emptyPermisoSet(): PermisoSet {
  return { subidores: [], lectores: [], editores: [], eliminadores: [] };
}

export function emptyConfiguracionDocumental(): ConfiguracionDocumental {
  return {
    documentosProducidos: [],
    permisosDefaultAdHoc: emptyPermisoSet()
  };
}

export function emptyDocumentoConfig(): DocumentoConfig {
  return {
    nombre: '',
    formatosAceptados: [],
    obligatorio: false,
    permisos: emptyPermisoSet(),
    inmutablePostCierre: false
  };
}

export function sujetoRequiereId(tipo: TipoSujetoPermiso): boolean {
  return tipo === 'ROL' || tipo === 'DEPARTAMENTO';
}
