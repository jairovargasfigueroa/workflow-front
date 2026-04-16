import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  stats = [
    { label: 'Trámites Pendientes', value: 24, icon: 'pending_actions', color: '#ff9800' },
    { label: 'En Proceso', value: 12, icon: 'autorenew', color: '#2196f3' },
    { label: 'Completados', value: 156, icon: 'check_circle', color: '#4caf50' },
    { label: 'Rechazados', value: 8, icon: 'cancel', color: '#f44336' }
  ];

  recentActivity = [
    { title: 'Trámite #1234 aprobado', time: 'Hace 5 minutos', icon: 'check_circle', color: '#4caf50' },
    { title: 'Nuevo trámite registrado', time: 'Hace 15 minutos', icon: 'add_circle', color: '#2196f3' },
    { title: 'Trámite #1230 rechazado', time: 'Hace 1 hora', icon: 'cancel', color: '#f44336' },
    { title: 'Usuario Juan actualizado', time: 'Hace 2 horas', icon: 'person', color: '#9c27b0' },
    { title: 'Trámite #1228 en revisión', time: 'Hace 3 horas', icon: 'rate_review', color: '#ff9800' }
  ];

  quickActions = [
    { label: 'Nuevo Trámite', icon: 'add', color: 'primary' },
    { label: 'Ver Pendientes', icon: 'pending_actions', color: 'accent' },
    { label: 'Reportes', icon: 'analytics', color: 'primary' }
  ];
}
