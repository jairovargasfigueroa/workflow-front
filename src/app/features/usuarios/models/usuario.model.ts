import { Rol } from '../../../core/models';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  fechaCreacion: string;
  departamentoId?: string;
  cargo?: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
  foto?: string;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  departamentoId?: string;
  cargo?: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
  foto?: string;
}
