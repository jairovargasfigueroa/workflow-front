import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Solicitudes', icon: 'assignment', route: '/solicitudes' },
    { label: 'Trámites', icon: 'description', route: '/tramites' },
    { label: 'Flujos de Trabajo', icon: 'account_tree', route: '/flujos-trabajo' },
    { label: 'Departamentos', icon: 'business', route: '/departamentos' },
    { label: 'Formularios', icon: 'dynamic_form', route: '/formularios' },
    { label: 'Usuarios', icon: 'people', route: '/usuarios' },
    { label: 'Analytics', icon: 'analytics', route: '/analytics' }
  ];
}
