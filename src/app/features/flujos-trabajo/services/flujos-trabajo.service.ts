import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import {
  FlujoTrabajo,
  FlujoTrabajoRequest,
  BorradorRequest,
  PublicarRequest,
  EstadoFlujoRequest,
  CopiarVersionRequest,
  FlujoVersion,
  FlujoVersionDetalle
} from '../models/flujo-trabajo.model';

@Injectable({
  providedIn: 'root'
})
export class FlujosTrabajoService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/flujos-trabajo';

  getAll(): Observable<FlujoTrabajo[]> {
    return this.http.get<FlujoTrabajo[]>(this.endpoint);
  }

  getById(id: string): Observable<FlujoTrabajo> {
    return this.http.get<FlujoTrabajo>(`${this.endpoint}/${id}`);
  }

  create(flujo: FlujoTrabajoRequest): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(this.endpoint, flujo);
  }

  update(id: string, flujo: FlujoTrabajoRequest): Observable<FlujoTrabajo> {
    return this.http.put<FlujoTrabajo>(`${this.endpoint}/${id}`, flujo);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  guardarBorrador(id: string, request: BorradorRequest): Observable<FlujoTrabajo> {
    return this.http.put<FlujoTrabajo>(`${this.endpoint}/${id}/borrador`, request);
  }

  publicar(id: string, request: PublicarRequest = {}): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(`${this.endpoint}/${id}/publicar`, request);
  }

  cambiarEstado(id: string, request: EstadoFlujoRequest): Observable<FlujoTrabajo> {
    return this.http.put<FlujoTrabajo>(`${this.endpoint}/${id}/estado`, request);
  }

  copiarVersionComoBorrador(id: string, request: CopiarVersionRequest): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(`${this.endpoint}/${id}/copiar-version-como-borrador`, request);
  }

  getVersiones(id: string): Observable<FlujoVersion[]> {
    return this.http.get<FlujoVersion[]>(`${this.endpoint}/${id}/versiones`);
  }

  getVersion(id: string, numeroVersion: number): Observable<FlujoVersionDetalle> {
    return this.http.get<FlujoVersionDetalle>(`${this.endpoint}/${id}/versiones/${numeroVersion}`);
  }

  getXml(id: string): Observable<string> {
    return this.http.get<{ xml: string }>(`${this.endpoint}/${id}/xml`).pipe(
      map(response => response.xml)
    );
  }

  descartarBorrador(id: string): Observable<FlujoTrabajo> {
    return this.http.delete<FlujoTrabajo>(`${this.endpoint}/${id}/borrador`);
  }

  getVersionById(flujoId: string, versionId: string): Observable<FlujoVersionDetalle> {
    return this.getVersiones(flujoId).pipe(
      map(versiones => {
        const version = versiones.find(v => v.id === versionId);
        if (!version) throw new Error(`Versión ${versionId} no encontrada`);
        return version.numero;
      }),
      switchMap(numero => this.getVersion(flujoId, numero))
    );
  }
}
