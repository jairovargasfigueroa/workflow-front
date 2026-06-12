import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  link?: string;
  /** Material icon — solo en el primer item del breadcrumb */
  icon?: string;
}

/** Mapa de segmento de URL → label visible (en español) e icono. */
const SECCIONES: Record<string, { label: string; icon: string }> = {
  dashboard: { label: 'Dashboard', icon: 'dashboard' },
  departamentos: { label: 'Departamentos', icon: 'business' },
  usuarios: { label: 'Usuarios', icon: 'people' },
  formularios: { label: 'Formularios', icon: 'dynamic_form' },
  tramites: { label: 'Trámites', icon: 'description' },
  solicitudes: { label: 'Solicitudes', icon: 'assignment' },
  'flujos-trabajo': { label: 'Flujos de trabajo', icon: 'account_tree' },
  analytics: { label: 'Analytics', icon: 'analytics' },
  reportes: { label: 'Reportes IA', icon: 'smart_toy' },
  anomalias: { label: 'Anomalías', icon: 'warning' },
  repositorio: { label: 'Repositorio', icon: 'folder_special' }
};

/** Mapa de sub-rutas conocidas → label. */
const SUBRUTAS: Record<string, string> = {
  editor: 'Editor',
  ver: 'Visor',
  responder: 'Responder',
  detalle: 'Detalle'
};

/**
 * Breadcrumb dinámico — escucha cambios de ruta y arma la jerarquía visible.
 *
 * Vive en su propia franja entre el header y el contenido (no dentro del header)
 * para que tenga buena legibilidad sobre fondo claro.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss'
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);

  private readonly urlActual = signal<string>(this.router.url);

  readonly items = computed<BreadcrumbItem[]>(() => this.buildBreadcrumb(this.urlActual()));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(e => this.urlActual.set(e.urlAfterRedirects));
  }

  private buildBreadcrumb(url: string): BreadcrumbItem[] {
    const path = url.split('?')[0].split('#')[0].replace(/^\/+/, '');
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) return [];

    const items: BreadcrumbItem[] = [];

    // 1) Primer segmento — la sección (con icono)
    const seccionKey = segments[0];
    const seccion = SECCIONES[seccionKey];
    if (seccion) {
      items.push({
        label: seccion.label,
        icon: seccion.icon,
        link: `/${seccionKey}`
      });
    } else {
      items.push({ label: capitalizar(seccionKey), link: `/${seccionKey}` });
    }

    // 2) Segmentos restantes — saltear UUIDs, mostrar nombres conocidos
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (esUuid(seg)) {
        if (i === segments.length - 1) {
          items.push({ label: 'Detalle' });
        }
        continue;
      }
      const label = SUBRUTAS[seg] ?? capitalizar(seg);
      items.push({ label });
    }

    return items;
  }
}

function esUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}
