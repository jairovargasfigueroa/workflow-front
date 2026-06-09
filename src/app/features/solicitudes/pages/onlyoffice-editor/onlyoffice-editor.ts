import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ArchivosService } from '../../services/archivos.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

declare global {
  interface Window {
    DocsAPI?: { DocEditor: new (placeholderId: string, config: unknown) => OnlyOfficeEditor };
  }
}

interface OnlyOfficeEditor {
  destroyEditor(): void;
}

type Estado = 'cargando' | 'listo' | 'error';

const PLACEHOLDER_ID = 'onlyoffice-placeholder';

@Component({
  selector: 'app-onlyoffice-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './onlyoffice-editor.html',
  styleUrl: './onlyoffice-editor.scss'
})
export class OnlyOfficeEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly archivosService = inject(ArchivosService);

  @ViewChild('placeholder', { static: true }) placeholderRef!: ElementRef<HTMLDivElement>;

  readonly estado = signal<Estado>('cargando');
  readonly mensajeError = signal<string>('');
  readonly nombreArchivo = signal<string>('');

  private archivoId: string | null = null;
  private soloVista = true;
  private editor: OnlyOfficeEditor | null = null;

  ngOnInit(): void {
    this.archivoId = this.route.snapshot.paramMap.get('id');
    // ?soloVista=false → modo edición. Cualquier otro valor (o ausencia) → lectura.
    const qp = this.route.snapshot.queryParamMap.get('soloVista');
    this.soloVista = qp !== 'false';
    if (!this.archivoId) {
      this.estado.set('error');
      this.mensajeError.set('No se recibió el ID del archivo.');
      return;
    }
    this.iniciar();
  }

  ngOnDestroy(): void {
    this.destruirEditor();
  }

  reintentar(): void {
    if (!this.archivoId) return;
    this.estado.set('cargando');
    this.mensajeError.set('');
    this.iniciar();
  }

  cerrarPestana(): void {
    window.close();
  }

  private iniciar(): void {
    if (!this.archivoId) return;

    this.archivosService.abrirEnOnlyOffice(this.archivoId, this.soloVista).subscribe({
      next: response => {
        this.nombreArchivo.set(response.config.document.title);
        this.cargarScript(response.documentServerUrl)
          .then(() => this.montarEditor(response.config))
          .catch(() => {
            this.estado.set('error');
            this.mensajeError.set(
              'El servidor de edición no está disponible. Intenta más tarde.'
            );
          });
      },
      error: (err: HttpErrorResponse) => {
        this.estado.set('error');
        this.mensajeError.set(mapHttpErrorToUserMessage(err));
      }
    });
  }

  private montarEditor(config: unknown): void {
    this.destruirEditor();
    this.placeholderRef.nativeElement.id = PLACEHOLDER_ID;

    if (!window.DocsAPI?.DocEditor) {
      this.estado.set('error');
      this.mensajeError.set('El script del editor no se inicializó correctamente.');
      return;
    }

    try {
      this.editor = new window.DocsAPI.DocEditor(PLACEHOLDER_ID, config);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
      this.mensajeError.set('No se pudo inicializar el editor.');
    }
  }

  private destruirEditor(): void {
    if (this.editor) {
      try {
        this.editor.destroyEditor();
      } catch {
        // OnlyOffice puede tirar al destruir; lo ignoramos.
      }
      this.editor = null;
    }
  }

  private cargarScript(documentServerUrl: string): Promise<void> {
    const url = `${documentServerUrl.replace(/\/$/, '')}/web-apps/apps/api/documents/api.js`;

    if (window.DocsAPI?.DocEditor) {
      return Promise.resolve();
    }

    const existente = document.querySelector<HTMLScriptElement>(`script[src="${url}"]`);
    if (existente) {
      return new Promise((resolve, reject) => {
        if (window.DocsAPI?.DocEditor) return resolve();
        existente.addEventListener('load', () => resolve(), { once: true });
        existente.addEventListener('error', () => reject(new Error('script error')), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el script de OnlyOffice'));
      document.body.appendChild(script);
    });
  }

}
