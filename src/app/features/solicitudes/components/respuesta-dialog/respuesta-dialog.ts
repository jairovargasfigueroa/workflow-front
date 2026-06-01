import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';

import { SolicitudesService } from '../../services/solicitudes.service';
import { SolicitudTramite, TareaActiva, RespuestaCampo } from '../../models/solicitud.model';
import { ArchivoResponse } from '../../models/archivo.model';
import { CampoFormulario } from '../../../formularios/models/formulario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SpeechService } from '../../../../core/services/speech.service';
import { ArchivosPanelComponent } from '../archivos-panel/archivos-panel';
import { ArchivoFieldComponent } from '../archivo-field/archivo-field';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';

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
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    MatTooltipModule,
    ArchivosPanelComponent,
    ArchivoFieldComponent
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
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly speechService = inject(SpeechService);

  get escuchando() { return this.speechService.escuchando; }

  saving = false;
  loadingData = true;
  solicitud = this.data.solicitud;

  tarea: TareaActiva | null = null;
  campos: CampoFormulario[] = [];
  accionSeleccionada: string | null = null;

  departamentoId = this.authService.currentUser()?.departamentoId ?? null;

  form = this.fb.nonNullable.group({
    comentario: ['']
  });

  dynamicForm: FormGroup = this.fb.group({});

  ngOnInit(): void {
    if (!this.departamentoId) {
      this.loadingData = false;
      return;
    }

    this.solicitudesService.getTareasActivas(this.solicitud.id, this.departamentoId).subscribe({
      next: tareas => {
        this.tarea = tareas[0] ?? null;
        if (this.tarea) {
          this.campos = this.tarea.campos;
          this.buildDynamicForm(this.tarea.campos);
        }
        this.loadingData = false;
      },
      error: () => { this.loadingData = false; }
    });
  }

  private buildDynamicForm(campos: CampoFormulario[]): void {
    const group: Record<string, any> = {};
    for (const campo of campos) {
      const validators = campo.requerido ? [Validators.required] : [];
      // Para FILE el valor del control es ArchivoResponse | null; required funciona igual.
      group[campo.nombre] = [campo.tipo === 'FILE' ? null : '', validators];
    }
    this.dynamicForm = this.fb.group(group);
  }

  get puedeEnviar(): boolean {
    const accionValida = (this.tarea?.acciones.length ?? 0) > 0
      ? this.accionSeleccionada !== null
      : true;
    return !this.form.invalid && !this.dynamicForm.invalid && !this.saving && accionValida;
  }

  startListening(target: string, opciones?: string[]): void {
    this.speechService.listen(target).subscribe(transcript => {
      if (target === '__comentario__') {
        this.form.get('comentario')?.setValue(transcript);
        return;
      }
      if (target === '__accion__') {
        const match = this.tarea?.acciones.find(a =>
          (a.etiqueta != null && transcript.toLowerCase().includes(a.etiqueta.toLowerCase())) ||
          transcript.toLowerCase().includes(a.valor.toLowerCase())
        );
        if (match) this.accionSeleccionada = match.valor;
        return;
      }
      if (opciones?.length) {
        const match = opciones.find(opt =>
          opt.toLowerCase().includes(transcript.toLowerCase()) ||
          transcript.toLowerCase().includes(opt.toLowerCase())
        );
        if (match) this.dynamicForm.get(target)?.setValue(match);
      } else {
        this.dynamicForm.get(target)?.setValue(transcript);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (!this.puedeEnviar || !this.tarea) return;

    this.saving = true;
    const formValue = this.form.getRawValue();
    const dynamicValues = this.dynamicForm.getRawValue();

    // Excluimos campos FILE de las respuestas (el archivo se vincula vía campoFormularioOrigen)
    const respuestas: RespuestaCampo[] = Object.entries(dynamicValues)
      .filter(([nombreCampo, valor]) => {
        const campo = this.campos.find(c => c.nombre === nombreCampo);
        if (campo?.tipo === 'FILE') return false;
        return valor != null && valor !== '';
      })
      .map(([nombreCampo, valor]) => ({ nombreCampo, valor: String(valor) }));

    const accion = this.tarea.acciones.length > 0
      ? (this.accionSeleccionada ?? '')
      : 'APROBADO';

    try {
      await firstValueFrom(this.solicitudesService.responderDepartamento(this.solicitud.id, {
        departamentoId: this.tarea.departamentoId,
        elementId: this.tarea.elementId,
        accion,
        comentario: formValue.comentario || undefined,
        respuestas
      }));
      this.notificationService.add({
        title: 'Respuesta enviada',
        message: 'La respuesta del departamento se registró correctamente',
        type: 'success'
      });
      this.dialogRef.close(true);
    } catch (err) {
      this.notificationService.add({
        title: 'Error al enviar respuesta',
        message: mapHttpErrorToUserMessage(err as HttpErrorResponse),
        type: 'error'
      });
      this.saving = false;
    }
  }
}
