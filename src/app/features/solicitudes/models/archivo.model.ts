export type ArchivoEstado = 'ACTIVO' | 'REEMPLAZADO' | 'ELIMINADO';

export type TipoEventoAuditoria =
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'VIEW_METADATA'
  | 'NEW_VERSION'
  | 'REVERT'
  | 'DELETE'
  | 'ACCESS_DENIED';

export const TIPO_EVENTO_AUDITORIA_LABELS: Record<TipoEventoAuditoria, string> = {
  UPLOAD: 'Subida',
  DOWNLOAD: 'Descarga',
  VIEW_METADATA: 'Vista de metadatos',
  NEW_VERSION: 'Nueva versión',
  REVERT: 'Reversión',
  DELETE: 'Eliminación',
  ACCESS_DENIED: 'Acceso denegado'
};

export interface ArchivoResponse {
  id: string;
  solicitudId: string;
  politicaId: string;
  clienteId: string;
  nombre: string;
  formato: string;
  tamanoBytes: number;
  contentType: string;
  subidoPor: string;
  subidoPorNombre: string;
  fechaSubida: string;
  departamentoOrigenId: string | null;
  campoFormularioOrigen: string | null;
  version: number;
  versionAnteriorId: string | null;
  linajeId?: string;
  estado: ArchivoEstado;
  modificadoPor: string | null;
  fechaModificacion: string | null;
  inmutable?: boolean;
}

export interface ArchivoDescargaResponse {
  archivoId: string;
  nombre: string;
  contentType: string;
  urlDescarga: string;
  expiraEn: string;
}

export interface ArchivoUploadRequest {
  archivo: File;
  solicitudId: string;
  departamentoOrigenId?: string | null;
  campoFormulario?: string | null;
}

export interface EventoAuditoriaResponse {
  id: string;
  archivoId: string | null;
  solicitudId: string | null;
  usuarioId: string;
  usuarioNombre: string;
  usuarioRol: string;
  usuarioDepartamentoId: string | null;
  tipo: TipoEventoAuditoria;
  fecha: string;
  detalle: string | null;
  motivoDenegacion: string | null;
}

export interface PaginatedResponse<T> {
  contenido: T[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface AuditoriaArchivosFiltros {
  archivoId?: string;
  solicitudId?: string;
  usuarioId?: string;
  tipo?: TipoEventoAuditoria;
  desde?: string;
  hasta?: string;
  page?: number;
  size?: number;
}

export type OnlyOfficeDocumentType = 'word' | 'cell' | 'slide';
export type OnlyOfficeMode = 'edit' | 'view';

export interface OnlyOfficeDocumentConfig {
  fileType: string;
  key: string;
  title: string;
  url: string;
  permissions: {
    edit: boolean;
    download: boolean;
    print: boolean;
  };
}

export interface OnlyOfficeEditorInnerConfig {
  documentType: OnlyOfficeDocumentType;
  document: OnlyOfficeDocumentConfig;
  editorConfig: {
    mode: OnlyOfficeMode;
    callbackUrl: string;
    user: { id: string; name: string };
    lang: string;
  };
  type: 'desktop';
  token: string;
}

export interface OnlyOfficeEditorConfigResponse {
  documentServerUrl: string;
  config: OnlyOfficeEditorInnerConfig;
  token: string;
}

export const FORMATOS_EDITABLES_ONLYOFFICE = ['docx', 'xlsx', 'pptx'] as const;
