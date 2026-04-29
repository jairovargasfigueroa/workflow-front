import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../models/usuario.model';
import { UsuarioDialogComponent } from '../../components/usuario-dialog/usuario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state';
import { PageHeaderComponent } from '../../../../shared/components/ui/page-header/page-header';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROL_LABELS, Rol } from '../../../../core/models';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss'
})
export class UsuariosListComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'email', 'rol', 'activo', 'acciones'];

  getRolLabel(rol: Rol): string {
    return ROL_LABELS[rol];
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.loading.set(true);
    this.usuariosService.getAll().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openDialog(usuario?: Usuario): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '600px',
      data: usuario ? { mode: 'edit', usuario } : { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsuarios();
      }
    });
  }

  confirmDelete(usuario: Usuario): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar usuario',
        message: `¿Está seguro que desea eliminar al usuario "${usuario.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteUsuario(usuario.id);
      }
    });
  }

  private deleteUsuario(id: string): void {
    this.usuariosService.delete(id).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Eliminado',
          message: 'Usuario eliminado correctamente',
          type: 'success'
        });
        this.loadUsuarios();
      },
      error: () => {
        this.loadUsuarios();
      }
    });
  }
}
