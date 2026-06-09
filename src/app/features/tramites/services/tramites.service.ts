import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tramite, TramiteRequest } from '../models/tramite.model';
import { DocumentoProducidoSlot } from '../../solicitudes/models/solicitud.model';

@Injectable({
  providedIn: 'root'
})
export class TramitesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/tramites';

  getAll(): Observable<Tramite[]> {
    return this.http.get<Tramite[]>(this.endpoint);
  }

  getById(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.endpoint}/${id}`);
  }

  create(tramite: TramiteRequest): Observable<Tramite> {
    return this.http.post<Tramite>(this.endpoint, tramite);
  }

  update(id: string, tramite: TramiteRequest): Observable<Tramite> {
    return this.http.put<Tramite>(`${this.endpoint}/${id}`, tramite);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Devuelve los documentos del kit que el solicitante debe entregar al crear
   * una solicitud de este trámite. Sale de la config del startEvent del flujo.
   */
  getDocumentosKit(id: string): Observable<DocumentoProducidoSlot[]> {
    return this.http.get<DocumentoProducidoSlot[]>(`${this.endpoint}/${id}/documentos-kit`);
  }
}
