import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRequest } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/usuarios';

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.endpoint);
  }

  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.endpoint}/${id}`);
  }

  create(usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.endpoint, usuario);
  }

  update(id: string, usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.endpoint}/${id}`, usuario);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
