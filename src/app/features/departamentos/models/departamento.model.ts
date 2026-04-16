export interface Departamento {
  id: string;
  nombre: string;
  descripcion: string;
  formularioId: string;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface DepartamentoRequest {
  nombre: string;
  descripcion?: string;
  formularioId?: string;
}
