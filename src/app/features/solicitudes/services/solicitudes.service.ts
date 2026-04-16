import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SolicitudTramite,
  SolicitudTramiteRequest,
  RespuestaDepartamentoRequest
} from '../models/solicitud.model';
import { EstadoTramite } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/solicitudes';

  getAll(): Observable<SolicitudTramite[]> {
    return this.http.get<SolicitudTramite[]>(this.endpoint);
  }

  getById(id: string): Observable<SolicitudTramite> {
    return this.http.get<SolicitudTramite>(`${this.endpoint}/${id}`);
  }

  getByTramite(tramiteId: string): Observable<SolicitudTramite[]> {
    return this.http.get<SolicitudTramite[]>(`${this.endpoint}/tramite/${tramiteId}`);
  }

  getBySolicitante(solicitanteId: string): Observable<SolicitudTramite[]> {
    return this.http.get<SolicitudTramite[]>(`${this.endpoint}/solicitante/${solicitanteId}`);
  }

  getByDepartamento(departamentoId: string): Observable<SolicitudTramite[]> {
    return this.http.get<SolicitudTramite[]>(`${this.endpoint}/departamento/${departamentoId}`);
  }

  getByDepartamentoAndEstado(departamentoId: string, estado: EstadoTramite): Observable<SolicitudTramite[]> {
    return this.http.get<SolicitudTramite[]>(`${this.endpoint}/departamento/${departamentoId}/estado/${estado}`);
  }

  create(solicitud: SolicitudTramiteRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(this.endpoint, solicitud);
  }

  update(id: string, solicitud: Partial<SolicitudTramiteRequest>): Observable<SolicitudTramite> {
    return this.http.put<SolicitudTramite>(`${this.endpoint}/${id}`, solicitud);
  }

  responderDepartamento(id: string, respuesta: RespuestaDepartamentoRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(`${this.endpoint}/${id}/respuesta-departamento`, respuesta);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
