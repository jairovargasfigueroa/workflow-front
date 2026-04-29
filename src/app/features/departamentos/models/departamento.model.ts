export interface Departamento {
  id: string;
  nombre: string;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface DepartamentoRequest {
  nombre: string;
}
