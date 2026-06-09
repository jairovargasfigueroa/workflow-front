import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArchivoResponse } from '../../solicitudes/models/archivo.model';
import { PaginaResponse, RepositorioFiltros } from '../models/repositorio.model';

@Injectable({
  providedIn: 'root'
})
export class RepositorioService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/archivos/repositorio';

  buscar(filtros: RepositorioFiltros = {}): Observable<PaginaResponse<ArchivoResponse>> {
    let params = new HttpParams()
      .set('page', String(filtros.page ?? 0))
      .set('size', String(filtros.size ?? 20));

    if (filtros.tramiteId) params = params.set('tramiteId', filtros.tramiteId);
    if (filtros.clienteId) params = params.set('clienteId', filtros.clienteId);
    if (filtros.formato) params = params.set('formato', filtros.formato);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);

    return this.http.get<PaginaResponse<ArchivoResponse>>(this.endpoint, { params });
  }
}
