import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AnalyticsResponse, TramiteOpcion } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  getCuellosDeBottella(tramiteId: string): Observable<AnalyticsResponse> {
    const mock: AnalyticsResponse = {
      tramiteId: '1',
      nombreTramite: 'Licencia de Construcción',
      cuellosDeBottella: [
        { departamentoId: 'd1', nombre: 'Departamento Legal', promedioHoras: 48, importanciaModelo: 0.61 },
        { departamentoId: 'd2', nombre: 'Departamento Técnico', promedioHoras: 31, importanciaModelo: 0.28 },
        { departamentoId: 'd3', nombre: 'Departamento Administrativo', promedioHoras: 12, importanciaModelo: 0.11 }
      ],
      recomendaciones: [
        {
          departamentoId: 'd1',
          nombreDepartamento: 'Departamento Legal',
          mensaje: 'Concentra el 61% del tiempo total. Revisar carga de trabajo o agregar funcionarios.'
        },
        {
          departamentoId: 'd2',
          nombreDepartamento: 'Departamento Técnico',
          mensaje: 'Alta variabilidad detectada. Estandarizar el proceso interno.'
        }
      ]
    };
    // TODO: replace with this.http.get<AnalyticsResponse>(`/analytics/cuellos-botella?tramiteId=${tramiteId}`)
    return of(mock).pipe(delay(800));
  }

  getTramites(): Observable<TramiteOpcion[]> {
    const mock: TramiteOpcion[] = [
      { id: '1', nombre: 'Licencia de Construcción' },
      { id: '2', nombre: 'Registro de Empresa' },
      { id: '3', nombre: 'Permiso Sanitario' }
    ];
    // TODO: replace with this.http.get<TramiteOpcion[]>('/tramites')
    return of(mock).pipe(delay(800));
  }
}
