import { Component, inject, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationPanelComponent } from '../../ui/notification-panel/notification-panel';
import { AuthService } from '../../../../core/services/auth.service';
import { ROL_LABELS } from '../../../../core/models';

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
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  menuToggle = output<void>();

  unreadCount = this.notificationService.unreadCount;
  hasUnread = this.notificationService.hasUnread;
  currentUser = this.authService.currentUser;
  readonly rolLabels = ROL_LABELS;

  logout(): void {
    this.authService.logout();
  }
}
