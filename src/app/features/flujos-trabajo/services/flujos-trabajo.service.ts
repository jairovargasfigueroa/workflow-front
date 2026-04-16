import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FlujoTrabajo, FlujoTrabajoRequest, DesplegarRequest } from '../models/flujo-trabajo.model';

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

  desplegar(id: string, request: DesplegarRequest): Observable<FlujoTrabajo> {
    return this.http.post<FlujoTrabajo>(`${this.endpoint}/${id}/desplegar`, request);
  }

  getDeployedXml(id: string): Observable<DesplegarRequest> {
    return this.http.get<DesplegarRequest>(`${this.endpoint}/${id}/xml`);
  }
}
