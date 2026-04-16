import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService, Notification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [DatePipe, MatListModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss'
})
export class NotificationPanelComponent {
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.allNotifications;
  hasUnread = this.notificationService.hasUnread;

  getIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error'
    };
    return icons[type];
  }

  getColor(type: Notification['type']): string {
    const colors: Record<Notification['type'], string> = {
      info: '#2196f3',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    };
    return colors[type];
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.remove(id);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }
}
