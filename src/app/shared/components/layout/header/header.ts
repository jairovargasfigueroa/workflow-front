import { Component, inject, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationPanelComponent } from '../../ui/notification-panel/notification-panel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDivider,
    MatBadgeModule,
    NotificationPanelComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private notificationService = inject(NotificationService);

  menuToggle = output<void>();

  unreadCount = this.notificationService.unreadCount;
  hasUnread = this.notificationService.hasUnread;
}
