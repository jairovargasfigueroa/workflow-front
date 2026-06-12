import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);

  readonly allNotifications = this.notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  markAsRead(id: string): void {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  remove(id: string): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  // Este método se usará cuando conectes el backend
  add(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date()
    };
    this.notifications.update(notifications => [newNotification, ...notifications]);
  }
}
