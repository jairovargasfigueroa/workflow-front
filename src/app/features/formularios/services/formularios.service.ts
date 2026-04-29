import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormularioTemplate, FormularioTemplateRequest } from '../models/formulario.model';

@Injectable({
  providedIn: 'root'
})
export class FormulariosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/formularios';

  getAll(): Observable<FormularioTemplate[]> {
    return this.http.get<FormularioTemplate[]>(this.endpoint);
  }

  getById(id: string): Observable<FormularioTemplate> {
    return this.http.get<FormularioTemplate>(`${this.endpoint}/${id}`);
  }

  create(formulario: FormularioTemplateRequest): Observable<FormularioTemplate> {
    return this.http.post<FormularioTemplate>(this.endpoint, formulario);
  }

  update(id: string, formulario: FormularioTemplateRequest): Observable<FormularioTemplate> {
    return this.http.put<FormularioTemplate>(`${this.endpoint}/${id}`, formulario);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
