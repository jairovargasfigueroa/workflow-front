import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';

import { RepositorioService } from '../../services/repositorio.service';
import {
  FORMATOS_REPOSITORIO,
  RepositorioFiltros,
  colorFormato,
  iconoFormato
} from '../../models/repositorio.model';
import { ArchivoResponse } from '../../../solicitudes/models/archivo.model';
import { ArchivosService } from '../../../solicitudes/services/archivos.service';
import {
  ArchivoAuditoriaModalComponent
} from '../../../solicitudes/components/archivo-auditoria-modal/archivo-auditoria-modal';
import { TramitesService } from '../../../tramites/services/tramites.service';
import { Tramite } from '../../../tramites/models/tramite.model';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';
import {
  caminoVer,
  esEditableOnline,
  puedeVerse
} from '../../../../core/utils/formato-archivo.util';

const REPO_SIZE = 200;   // Cap del backend.

interface FiltrosForm {
  tramiteId: string;
  clienteId: string;
  formato: string;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
}

interface NodoSolicitud {
  id: string;
  idCorto: string;
  fechaMin: string;
  archivos: ArchivoResponse[];
}
interface NodoUsuario {
  id: string;
  nombre: string;
  total: number;
  expandido: boolean;
  solicitudes: NodoSolicitud[];
}
interface NodoTramite {
  id: string;
  nombre: string;
  total: number;
  expandido: boolean;
  usuarios: NodoUsuario[];
}

@Component({
  selector: 'app-repositorio-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './repositorio-list.html',
  styleUrl: './repositorio-list.scss'
})
export class RepositorioListComponent implements OnInit {
  private readonly repositorioService = inject(RepositorioService);
  private readonly archivosService = inject(ArchivosService);
  private readonly tramitesService = inject(TramitesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly feedback = inject(FeedbackService);
  private readonly matDialog = inject(MatDialog);

  readonly formatos = FORMATOS_REPOSITORIO;

  // Catálogos.
  readonly tramites = signal<Tramite[]>([]);
  readonly clientes = signal<Usuario[]>([]);
  private tramitesMap = new Map<string, string>();
  private clientesMap = new Map<string, string>();

  // Estado de carga.
  readonly cargando = signal(false);
  readonly totalBackend = signal(0);
  readonly truncado = computed(() => this.totalBackend() > REPO_SIZE);
  readonly mostrandoCount = signal(0);

  // Árbol y selección.
  readonly arbol = signal<NodoTramite[]>([]);
  readonly solicitudSeleccionada = signal<NodoSolicitud | null>(null);
  readonly contextoSeleccion = signal<{ tramite: string; usuario: string } | null>(null);

  filtros: FiltrosForm = {
    tramiteId: '',
    clienteId: '',
    formato: '',
    fechaDesde: null,
    fechaHasta: null
  };

  readonly hayFiltros = computed(() => {
    const f = this.filtros;
    return !!(f.tramiteId || f.clienteId || f.formato || f.fechaDesde || f.fechaHasta);
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.buscar();
  }

  private cargarCatalogos(): void {
    this.tramitesService.getAll().subscribe({
      next: tramites => {
        this.tramites.set(tramites);
        this.tramitesMap = new Map(tramites.map(t => [t.id, t.nombre]));
      },
      error: () => {}
    });
    this.usuariosService.getAll().subscribe({
      next: usuarios => {
        const todos = usuarios;
        const solicitantes = usuarios.filter(u => u.rol === 'SOLICITANTE');
        this.clientes.set(solicitantes);
        // Para el árbol usamos TODOS los usuarios (un archivo puede ser subido por
        // un funcionario también, no sólo por el solicitante dueño).
        this.clientesMap = new Map(todos.map(u => [u.id, u.nombre]));
      },
      error: () => {}
    });
  }

  buscar(): void {
    this.solicitudSeleccionada.set(null);
    this.contextoSeleccion.set(null);
    this.cargando.set(true);

    const filtros: RepositorioFiltros = {
      tramiteId: this.filtros.tramiteId || undefined,
      clienteId: this.filtros.clienteId || undefined,
      formato: this.filtros.formato || undefined,
      fechaDesde: this.filtros.fechaDesde ? this.filtros.fechaDesde.toISOString() : undefined,
      fechaHasta: this.filtros.fechaHasta ? this.filtros.fechaHasta.toISOString() : undefined,
      page: 0,
      size: REPO_SIZE
    };

    this.repositorioService.buscar(filtros).subscribe({
      next: res => {
        const contenido = res.contenido ?? [];
        this.totalBackend.set(res.total ?? contenido.length);
        this.mostrandoCount.set(contenido.length);
        this.arbol.set(this.armarArbol(contenido));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.feedback.error(mapHttpErrorToUserMessage(err));
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      tramiteId: '',
      clienteId: '',
      formato: '',
      fechaDesde: null,
      fechaHasta: null
    };
    this.buscar();
  }

  // ---- Construcción del árbol ----

  private armarArbol(archivos: ArchivoResponse[]): NodoTramite[] {
    const tramites = new Map<string, NodoTramite>();

    for (const a of archivos) {
      const tramId = a.politicaId || '_sin_tramite';
      const userId = a.clienteId || '_sin_usuario';
      const solId = a.solicitudId || '_sin_solicitud';

      let tramite = tramites.get(tramId);
      if (!tramite) {
        tramite = {
          id: tramId,
          nombre: this.nombreTramite(tramId),
          total: 0,
          expandido: false,
          usuarios: []
        };
        tramites.set(tramId, tramite);
      }
      tramite.total++;

      let usuario = tramite.usuarios.find(u => u.id === userId);
      if (!usuario) {
        usuario = {
          id: userId,
          nombre: this.nombreCliente(userId),
          total: 0,
          expandido: false,
          solicitudes: []
        };
        tramite.usuarios.push(usuario);
      }
      usuario.total++;

      let solicitud = usuario.solicitudes.find(s => s.id === solId);
      if (!solicitud) {
        solicitud = {
          id: solId,
          idCorto: solId.slice(0, 6).toUpperCase(),
          fechaMin: a.fechaSubida,
          archivos: []
        };
        usuario.solicitudes.push(solicitud);
      }
      solicitud.archivos.push(a);
      if (a.fechaSubida < solicitud.fechaMin) solicitud.fechaMin = a.fechaSubida;
    }

    // Orden: trámites alfabético, usuarios alfabético, solicitudes por fecha (más reciente primero).
    const arbol = Array.from(tramites.values());
    arbol.sort((a, b) => a.nombre.localeCompare(b.nombre));
    for (const t of arbol) {
      t.usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      for (const u of t.usuarios) {
        u.solicitudes.sort((a, b) => b.fechaMin.localeCompare(a.fechaMin));
      }
    }
    return arbol;
  }

  toggleTramite(t: NodoTramite): void {
    t.expandido = !t.expandido;
    this.arbol.set([...this.arbol()]);
  }
  toggleUsuario(u: NodoUsuario): void {
    u.expandido = !u.expandido;
    this.arbol.set([...this.arbol()]);
  }
  seleccionarSolicitud(t: NodoTramite, u: NodoUsuario, s: NodoSolicitud): void {
    this.solicitudSeleccionada.set(s);
    this.contextoSeleccion.set({ tramite: t.nombre, usuario: u.nombre });
  }

  // ---- Resolución de nombres ----

  nombreTramite(id: string): string {
    if (!id || id === '_sin_tramite') return '— Sin trámite —';
    return this.tramitesMap.get(id) ?? id.slice(0, 8);
  }
  nombreCliente(id: string): string {
    if (!id || id === '_sin_usuario') return '— Sin usuario —';
    return this.clientesMap.get(id) ?? id.slice(0, 8);
  }

  // ---- Helpers de formato ----

  iconoArchivo(a: ArchivoResponse): string { return iconoFormato(a.formato); }
  colorArchivo(a: ArchivoResponse): string { return colorFormato(a.formato); }

  formatTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  // ---- Acciones por fila ----

  puedeVer(a: ArchivoResponse): boolean { return puedeVerse(a.formato); }
  puedeEditarOnline(a: ArchivoResponse): boolean {
    if (a.inmutable) return false;
    return esEditableOnline(a.formato);
  }

  async ver(a: ArchivoResponse): Promise<void> {
    const camino = caminoVer(a.formato);
    if (camino === 'onlyoffice') {
      window.open(`/archivos/${a.id}/abrir?soloVista=true`, '_blank');
      return;
    }
    if (camino === 'navegador') {
      try {
        const res = await firstValueFrom(this.archivosService.descargar(a.id, false));
        window.open(res.urlDescarga, '_blank');
      } catch (err) {
        this.feedback.error(mapHttpErrorToUserMessage(err as HttpErrorResponse));
      }
      return;
    }
    this.descargar(a);
  }

  async descargar(a: ArchivoResponse): Promise<void> {
    try {
      const res = await firstValueFrom(this.archivosService.descargar(a.id, true));
      const link = document.createElement('a');
      link.href = res.urlDescarga;
      link.download = a.nombre;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      this.feedback.error(mapHttpErrorToUserMessage(err as HttpErrorResponse));
    }
  }

  abrirAuditoria(a: ArchivoResponse): void {
    this.matDialog.open(ArchivoAuditoriaModalComponent, {
      data: { archivoId: a.id, nombreArchivo: a.nombre },
      width: '720px',
      maxHeight: '85vh'
    });
  }
}
