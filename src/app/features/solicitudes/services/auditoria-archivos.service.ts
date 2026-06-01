import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuditoriaArchivosFiltros,
  EventoAuditoriaResponse,
  PaginatedResponse
} from '../models/archivo.model';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaArchivosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/auditoria/archivos';

  buscar(filtros: AuditoriaArchivosFiltros = {}): Observable<PaginatedResponse<EventoAuditoriaResponse>> {
    let params = new HttpParams();
    if (filtros.archivoId) params = params.set('archivoId', filtros.archivoId);
    if (filtros.solicitudId) params = params.set('solicitudId', filtros.solicitudId);
    if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    params = params.set('page', String(filtros.page ?? 0));
    params = params.set('size', String(filtros.size ?? 50));

    return this.http.get<PaginatedResponse<EventoAuditoriaResponse>>(this.endpoint, { params });
  }
}
