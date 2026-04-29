import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
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
import { RespuestaCampo } from '../../models/solicitud.model';
import { TramitesService } from '../../../tramites/services/tramites.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { Tramite } from '../../../tramites/models/tramite.model';
import { FormularioTemplate, CampoFormulario } from '../../../formularios/models/formulario.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-solicitud-dialog',
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
  templateUrl: './solicitud-dialog.html',
  styleUrl: './solicitud-dialog.scss'
})
export class SolicitudDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SolicitudDialogComponent>);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly tramitesService = inject(TramitesService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly notificationService = inject(NotificationService);

  saving = false;
  tramites: Tramite[] = [];
  formulario: FormularioTemplate | null = null;
  campos: CampoFormulario[] = [];

  form = this.fb.nonNullable.group({
    tramiteId: ['', Validators.required]
  });

  dynamicForm: FormGroup = this.fb.group({});

  ngOnInit(): void {
    this.tramitesService.getAll().subscribe({
      next: data => this.tramites = data.filter(t => t.activo)
    });
  }

  onTramiteChange(tramiteId: string): void {
    this.formulario = null;
    this.campos = [];
    this.dynamicForm = this.fb.group({});

    const tramite = this.tramites.find(t => t.id === tramiteId);
    if (tramite?.formularioSolicitanteId) {
      this.formulariosService.getById(tramite.formularioSolicitanteId).subscribe({
        next: (form) => {
          this.formulario = form;
          this.campos = form.campos;
          this.buildDynamicForm(form.campos);
        }
      });
    }
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

    this.solicitudesService.create({
      tramiteId: formValue.tramiteId,
      respuestas,
      adjuntos: []
    }).subscribe({
      next: () => {
        this.notificationService.add({
          title: 'Solicitud creada',
          message: 'La solicitud se ha creado correctamente',
          type: 'success'
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.saving = false;
        const msg = error?.error?.message ?? '';
        if (error.status === 400 && msg.toLowerCase().includes('activo')) {
          this.notificationService.add({
            title: 'Trámite no disponible',
            message: 'El flujo de trabajo de este trámite no está activo. Contacta al administrador.',
            type: 'error'
          });
        }
      }
    });
  }
}
