import { Rol } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
  cedula?: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  departamentoId: string | null;
}
