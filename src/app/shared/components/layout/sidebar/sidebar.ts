import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { Rol } from '../../../../core/models';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: Rol[]; // si está vacío/ausente → visible para todos los autenticados
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  private readonly allItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Solicitudes', icon: 'assignment', route: '/solicitudes' },
    { label: 'Trámites', icon: 'description', route: '/tramites' },
    { label: 'Flujos de Trabajo', icon: 'account_tree', route: '/flujos-trabajo' },
    { label: 'Departamentos', icon: 'business', route: '/departamentos' },
    { label: 'Formularios', icon: 'dynamic_form', route: '/formularios' },
    { label: 'Usuarios', icon: 'people', route: '/usuarios' },
    { label: 'Analytics', icon: 'analytics', route: '/analytics' },
    { label: 'Reportes IA', icon: 'auto_awesome', route: '/reportes', roles: ['ADMIN', 'FUNCIONARIO'] },
    { label: 'Anomalías', icon: 'crisis_alert', route: '/anomalias', roles: ['ADMIN'] },
    { label: 'Repositorio Documental', icon: 'inventory_2', route: '/repositorio', roles: ['ADMIN'] }
  ];

  readonly menuItems = computed<MenuItem[]>(() => {
    const rol = this.authService.currentUser()?.rol;
    return this.allItems.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!rol) return false;
      return item.roles.includes(rol);
    });
  });
}
