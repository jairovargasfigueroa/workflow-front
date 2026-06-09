import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import {
  ArchivoDescargaResponse,
  ArchivoResponse,
  ArchivoUploadRequest,
  OnlyOfficeEditorConfigResponse
} from '../models/archivo.model';

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/archivos';

  // Bus interno: emite el solicitudId cuando algo cambia (upload/delete/version/revert).
  // Componentes (archivos-panel, archivo-field) se suscriben para refrescarse.
  private readonly _changes$ = new Subject<string>();
  readonly changes$ = this._changes$.asObservable();

  notifyChange(solicitudId: string): void {
    this._changes$.next(solicitudId);
  }

  listarPorSolicitud(solicitudId: string): Observable<ArchivoResponse[]> {
    return this.http.get<ArchivoResponse[]>(`${this.endpoint}/solicitud/${solicitudId}`);
  }

  metadata(archivoId: string): Observable<ArchivoResponse> {
    return this.http.get<ArchivoResponse>(`${this.endpoint}/${archivoId}/metadata`);
  }

  /**
   * Obtiene la URL prefirmada para descargar/ver un archivo.
   * @param attachment true → Content-Disposition: attachment (baja). false → inline (muestra).
   *                   Default true (compat con el back).
   */
  descargar(archivoId: string, attachment = true): Observable<ArchivoDescargaResponse> {
    const params = new HttpParams().set('attachment', String(attachment));
    return this.http.get<ArchivoDescargaResponse>(
      `${this.endpoint}/${archivoId}/descargar`,
      { params }
    );
  }

  upload(req: ArchivoUploadRequest): Observable<ArchivoResponse> {
    const formData = this.buildFormData(req);
    return this.http.post<ArchivoResponse>(`${this.endpoint}/upload`, formData).pipe(
      tap(() => this.notifyChange(req.solicitudId))
    );
  }

  uploadConProgreso(req: ArchivoUploadRequest): Observable<HttpEvent<ArchivoResponse>> {
    const formData = this.buildFormData(req);
    return this.http.post<ArchivoResponse>(`${this.endpoint}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  nuevaVersion(archivoId: string, archivo: File, solicitudId: string): Observable<ArchivoResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.put<ArchivoResponse>(`${this.endpoint}/${archivoId}`, formData).pipe(
      tap(() => this.notifyChange(solicitudId))
    );
  }

  eliminar(archivoId: string, solicitudId: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${archivoId}`).pipe(
      tap(() => this.notifyChange(solicitudId))
    );
  }

  listarVersiones(archivoId: string): Observable<ArchivoResponse[]> {
    return this.http.get<ArchivoResponse[]>(`${this.endpoint}/${archivoId}/versiones`);
  }

  revertir(archivoId: string, numero: number, solicitudId: string): Observable<ArchivoResponse> {
    return this.http.post<ArchivoResponse>(`${this.endpoint}/${archivoId}/revertir/${numero}`, {}).pipe(
      tap(() => this.notifyChange(solicitudId))
    );
  }

  /**
   * Pide la config de OnlyOffice para abrir un archivo.
   * @param soloVista true → modo lectura. false → modo edición (el back decide
   *                  el modo real según permisos / inmutabilidad).
   */
  abrirEnOnlyOffice(archivoId: string, soloVista: boolean): Observable<OnlyOfficeEditorConfigResponse> {
    const params = new HttpParams().set('soloVista', String(soloVista));
    return this.http.get<OnlyOfficeEditorConfigResponse>(
      `/onlyoffice/abrir/${archivoId}`,
      { params }
    );
  }

  private buildFormData(req: ArchivoUploadRequest): FormData {
    const formData = new FormData();
    formData.append('archivo', req.archivo);
    formData.append('solicitudId', req.solicitudId);
    if (req.departamentoOrigenId) {
      formData.append('departamentoOrigenId', req.departamentoOrigenId);
    }
    if (req.campoFormulario) {
      formData.append('campoFormulario', req.campoFormulario);
    }
    return formData;
  }
}
