export type Rol = 'ADMIN' | 'FUNCIONARIO' | 'SOLICITANTE';

export type TipoCampo =
  | 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'FILE' | 'TEXTAREA'
  | 'RADIO' | 'CHECKBOX' | 'BOOLEAN' | 'EMAIL' | 'PHONE' | 'TABLA' | 'GRID';

export type EstadoTramite = 'PENDIENTE' | 'EN_PROCESO' | 'CANCELADO' | 'APROBADO' | 'RECHAZADO';

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: 'Administrador',
  FUNCIONARIO: 'Funcionario',
  SOLICITANTE: 'Solicitante'
};

export const ESTADO_TRAMITE_LABELS: Record<EstadoTramite, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  CANCELADO: 'Cancelado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado'
};

export const TIPO_CAMPO_LABELS: Record<TipoCampo, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Fecha',
  SELECT: 'Selección',
  FILE: 'Archivo',
  TEXTAREA: 'Texto largo',
  RADIO: 'Opción única (radio)',
  CHECKBOX: 'Opción múltiple (checkbox)',
  BOOLEAN: 'Sí / No',
  EMAIL: 'Email',
  PHONE: 'Teléfono',
  TABLA: 'Tabla',
  GRID: 'GRID (matriz)'
};
