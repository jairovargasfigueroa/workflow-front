import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Departamento, DepartamentoRequest } from '../models/departamento.model';

@Injectable({
  providedIn: 'root'
})
export class DepartamentosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/departamentos';

  getAll(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.endpoint);
  }

  getById(id: string): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.endpoint}/${id}`);
  }

  create(departamento: DepartamentoRequest): Observable<Departamento> {
    return this.http.post<Departamento>(this.endpoint, departamento);
  }

  update(id: string, departamento: DepartamentoRequest): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.endpoint}/${id}`, departamento);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
