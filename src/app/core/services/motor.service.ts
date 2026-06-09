import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  AnomaliasFiltros,
  AnomaliasPagedResponse,
  DashboardPrioridadResponse,
  MejorRutaResponse,
  RiesgoResponse
} from '../models/motor';

/**
 * Servicio del Motor Inteligente.
 *
 * Patrón clave: si un endpoint del motor falla (500, network), el servicio retorna
 * una respuesta "sintética" con `disponible: false` para que la UI lo trate igual
 * que un disponible: false legítimo del backend (mensaje suave, no toast rojo).
 */
@Injectable({ providedIn: 'root' })
export class MotorService {
  private readonly http = inject(HttpClient);
  private readonly base = '/motor';

  getMejorRuta(flujoId: string): Observable<MejorRutaResponse> {
    return this.http.get<MejorRutaResponse>(`${this.base}/flujo/${flujoId}/mejor-ruta`).pipe(
      catchError(() => of<MejorRutaResponse>({
        flujoId,
        rutas: [],
        rutaRecomendadaNombre: null,
        disponible: false
      }))
    );
  }

  getRiesgo(flujoId: string): Observable<RiesgoResponse> {
    return this.http.get<RiesgoResponse>(`${this.base}/flujo/${flujoId}/riesgo`).pipe(
      catchError(() => of<RiesgoResponse>({
        flujoId,
        cuellosPredichos: [],
        demorasPredichas: [],
        cumplimientoSlaEsperado: null,
        disponible: false
      }))
    );
  }

  getAnomalias(filtros: AnomaliasFiltros = {}): Observable<AnomaliasPagedResponse> {
    let params = new HttpParams()
      .set('page', String(filtros.page ?? 0))
      .set('size', String(filtros.size ?? 20));
    if (filtros.severidad) params = params.set('severidad', filtros.severidad);

    return this.http.get<AnomaliasPagedResponse>(`${this.base}/anomalias`, { params }).pipe(
      catchError(() => of<AnomaliasPagedResponse>({
        contenido: [],
        total: 0,
        pagina: filtros.page ?? 0,
        totalPaginas: 0,
        disponible: false
      }))
    );
  }

  descartarAnomalia(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/anomalia/${id}/descartar`, {});
  }

  getDashboardPrioridad(): Observable<DashboardPrioridadResponse> {
    return this.http.get<DashboardPrioridadResponse>(`${this.base}/dashboard-prioridad`).pipe(
      catchError(() => of<DashboardPrioridadResponse>({
        totalConPrioridadAlta: 0,
        totalConPrioridadMedia: 0,
        totalConPrioridadBaja: 0,
        topUrgentes: [],
        disponible: false
      }))
    );
  }
}
