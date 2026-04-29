import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FlujosListResponse, OptimizarResponse, RespuestaEntrenamiento } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);

  getFlujos(): Observable<FlujosListResponse> {
    return this.http.get<FlujosListResponse>('/analytics/flujos');
  }

  optimizarFlujo(flujoId: string): Observable<OptimizarResponse> {
    return this.http.post<OptimizarResponse>('/analytics/optimizar', { flujoId });
  }

  entrenarModelo(): Observable<RespuestaEntrenamiento> {
    return this.http.post<RespuestaEntrenamiento>('/modelo/entrenar', {});
  }
}
