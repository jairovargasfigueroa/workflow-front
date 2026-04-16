import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudTramite, RespuestaCampo } from '../../models/solicitud.model';
import { DepartamentosService } from '../../../departamentos/services/departamentos.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Departamento } from '../../../departamentos/models/departamento.model';
import { FormularioTemplate, CampoFormulario } from '../../../formularios/models/formulario.model';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { NotificationService } from '../../../../core/services/notification.service';

export interface RespuestaDialogData {
  solicitud: SolicitudTramite;
}

@Component({
  selector: 'app-respuesta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './respuesta-dialog.html',
  styleUrl: './respuesta-dialog.scss'
})
export class RespuestaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RespuestaDialogComponent>);
  private readonly data = inject<RespuestaDialogData>(MAT_DIALOG_DATA);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly departamentosService = inject(DepartamentosService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly notificationService = inject(NotificationService);

  saving = false;
  solicitud = this.data.solicitud;
  departamento: Departamento | null = null;
  formulario: FormularioTemplate | null = null;
  campos: CampoFormulario[] = [];
  funcionarios: Usuario[] = [];

  form = this.fb.nonNullable.group({
    funcionarioId: ['', Validators.required],
    accion: ['', Validators.required],
    comentario: ['']
  });

  dynamicForm: FormGroup = this.fb.group({});

  acciones = [
    { value: 'APROBADO', label: 'Aprobar' },
    { value: 'RECHAZADO', label: 'Rechazar' },
    { value: 'OBSERVADO', label: 'Observar' }
  ];

  ngOnInit(): void {
    if (this.solicitud.departamentoActualId) {
      this.departamentosService.getById(this.solicitud.departamentoActualId).subscribe({
        next: (depto) => {
          this.departamento = depto;
          if (depto.formularioId) {
            this.formulariosService.getById(depto.formularioId).subscribe({
              next: (form) => {
                this.formulario = form;
                this.campos = form.campos;
                this.buildDynamicForm(form.campos);
              }
            });
          }
        }
      });
    }

    this.usuariosService.getAll().subscribe({
      next: (data) => this.funcionarios = data.filter(u => u.rol === 'FUNCIONARIO' && u.activo)
    });
  }

  private buildDynamicForm(campos: CampoFormulario[]): void {
    const group: Record<string, any> = {};
    for (const campo of campos) {
      group[campo.nombre] = campo.requerido ? ['', Validators.required] : [''];
    }
    this.dynamicForm = this.fb.group(group);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid || this.dynamicForm.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.getRawValue();
    const dynamicValues = this.dynamicForm.getRawValue();

    const respuestas: RespuestaCampo[] = Object.entries(dynamicValues)
      .filter(([, valor]) => valor != null && valor !== '')
      .map(([nombreCampo, valor]) => ({
        nombreCampo,
        valor: String(valor)
      }));

    this.solicitudesService.responderDepartamento(this.solicitud.id, {
      departamentoId: this.solicitud.departamentoActualId!,
      formularioId: this.departamento?.formularioId || '',
      funcionarioId: formValue.funcionarioId,
      accion: formValue.accion as 'APROBADO' | 'RECHAZADO' | 'OBSERVADO',
      comentario: formValue.comentario || undefined,
      respuestas
    }).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Respuesta enviada',
          message: 'La respuesta del departamento se registró correctamente',
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
