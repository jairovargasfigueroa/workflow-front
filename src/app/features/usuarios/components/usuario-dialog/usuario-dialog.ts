import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../models/usuario.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { Departamento } from '../../../departamentos/models/departamento.model';
import { Rol, ROL_LABELS } from '../../../../core/models';

export interface UsuarioDialogData {
  mode: 'create' | 'edit';
  usuario?: Usuario;
}

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './usuario-dialog.html',
  styleUrl: './usuario-dialog.scss'
})
export class UsuarioDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UsuarioDialogComponent>);
  private readonly data = inject<UsuarioDialogData>(MAT_DIALOG_DATA);
  private readonly usuariosService = inject(UsuariosService);
  private readonly departamentosService = inject(DepartamentosService);
  private readonly notificationService = inject(NotificationService);

  isEditMode = this.data.mode === 'edit';
  saving = false;
  departamentos: Departamento[] = [];

  roles: { value: Rol; label: string }[] = [
    { value: 'ADMIN', label: ROL_LABELS.ADMIN },
    { value: 'FUNCIONARIO', label: ROL_LABELS.FUNCIONARIO },
    { value: 'SOLICITANTE', label: ROL_LABELS.SOLICITANTE }
  ];

  form = this.fb.nonNullable.group({
    nombre: [this.data.usuario?.nombre || '', [Validators.required, Validators.maxLength(100)]],
    email: [this.data.usuario?.email || '', [Validators.required, Validators.email]],
    password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
    rol: [this.data.usuario?.rol || 'SOLICITANTE' as Rol, [Validators.required]],
    departamentoId: [this.data.usuario?.departamentoId || ''],
    cargo: [this.data.usuario?.cargo || ''],
    telefono: [this.data.usuario?.telefono || ''],
    direccion: [this.data.usuario?.direccion || ''],
    cedula: [this.data.usuario?.cedula || '']
  });

  get title(): string {
    return this.isEditMode ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  get showDepartamento(): boolean {
    return this.form.controls.rol.value === 'FUNCIONARIO';
  }

  ngOnInit(): void {
    this.loadDepartamentos();

    // Escuchar cambios en el rol
    this.form.controls.rol.valueChanges.subscribe(rol => {
      if (rol !== 'FUNCIONARIO') {
        this.form.controls.departamentoId.setValue('');
      }
    });
  }

  loadDepartamentos(): void {
    this.departamentosService.getAll().subscribe({
      next: (data) => this.departamentos = data
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formData = this.form.getRawValue();

    // Si es edición y no se cambió el password, enviarlo vacío (el backend lo ignora)
    const requestData = {
      ...formData,
      password: formData.password || (this.isEditMode ? '' : formData.password)
    };

    const request$ = this.isEditMode
      ? this.usuariosService.update(this.data.usuario!.id, requestData)
      : this.usuariosService.create(requestData);

    request$.subscribe({
      next: () => {
        this.notificationService.add({
          title: this.isEditMode ? 'Actualizado' : 'Creado',
          message: `Usuario ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
          type: 'success'
        });
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
