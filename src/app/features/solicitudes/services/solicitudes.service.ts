import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SolicitudTramite,
  SolicitudTramiteResumen,
  SolicitudTramiteRequest,
  RespuestaDepartamentoRequest,
  TareaActiva,
  TomarLiberarRequest
} from '../models/solicitud.model';
import { EstadoTramite } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/solicitudes';

  getAll(): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(this.endpoint);
  }

  getById(id: string): Observable<SolicitudTramite> {
    return this.http.get<SolicitudTramite>(`${this.endpoint}/${id}`);
  }

  getByTramite(tramiteId: string): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/tramite/${tramiteId}`);
  }

  getBySolicitante(solicitanteId: string): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/solicitante/${solicitanteId}`);
  }

  getByDepartamento(departamentoId: string): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/departamento/${departamentoId}`);
  }

  getByDepartamentoAndEstado(departamentoId: string, estado: EstadoTramite): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/departamento/${departamentoId}/estado/${estado}`);
  }

  create(solicitud: SolicitudTramiteRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(this.endpoint, solicitud);
  }

  update(id: string, solicitud: Partial<SolicitudTramiteRequest>): Observable<SolicitudTramite> {
    return this.http.put<SolicitudTramite>(`${this.endpoint}/${id}`, solicitud);
  }

  getTareasActivas(solicitudId: string, departamentoId: string): Observable<TareaActiva[]> {
    return this.http.get<TareaActiva[]>(`${this.endpoint}/${solicitudId}/tarea-activa`, {
      params: { departamentoId }
    });
  }

  responderDepartamento(id: string, respuesta: RespuestaDepartamentoRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(`${this.endpoint}/${id}/respuesta-departamento`, respuesta);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  getBandejaDepartamento(): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/mi-departamento/pendientes`);
  }

  getMisTareas(): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/mi-departamento/mis-tareas`);
  }

  getHistorialDepartamento(): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/mi-departamento/historial`);
  }

  getMisSolicitudes(): Observable<SolicitudTramiteResumen[]> {
    return this.http.get<SolicitudTramiteResumen[]>(`${this.endpoint}/mis-solicitudes`);
  }

  tomar(id: string, req: TomarLiberarRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(`${this.endpoint}/${id}/tomar`, req);
  }

  liberar(id: string, req: TomarLiberarRequest): Observable<SolicitudTramite> {
    return this.http.post<SolicitudTramite>(`${this.endpoint}/${id}/liberar`, req);
  }
}
