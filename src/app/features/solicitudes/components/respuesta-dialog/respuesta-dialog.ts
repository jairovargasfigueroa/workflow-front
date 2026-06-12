import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';

import { SolicitudesService } from '../../services/solicitudes.service';
import { ArchivosService } from '../../services/archivos.service';
import {
  DocumentoProducidoSlot,
  RespuestaCampo,
  SolicitudTramite,
  TareaActiva
} from '../../models/solicitud.model';
import { ArchivoResponse } from '../../models/archivo.model';
import { CampoFormulario } from '../../../formularios/models/formulario.model';
import { TipoCampo } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { SpeechService } from '../../../../core/services/speech.service';
import { ArchivosPanelComponent } from '../archivos-panel/archivos-panel';
import { DocProducidoSlotComponent } from '../doc-producido-slot/doc-producido-slot';
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
    MatRadioModule,
    MatCheckboxModule,
    ArchivosPanelComponent,
    DocProducidoSlotComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './respuesta-dialog.html',
  styleUrl: './respuesta-dialog.scss'
})
export class RespuestaDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RespuestaDialogComponent>);
  private readonly data = inject<RespuestaDialogData>(MAT_DIALOG_DATA);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly archivosService = inject(ArchivosService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly speechService = inject(SpeechService);

  get escuchando() { return this.speechService.escuchando; }

  saving = false;
  loadingData = true;
  solicitud = this.data.solicitud;

  tarea: TareaActiva | null = null;
  /** Campos del formulario del nodo, FILTRADOS para excluir tipo FILE (ahora son slots). */
  campos: CampoFormulario[] = [];
  slots: DocumentoProducidoSlot[] = [];
  accionSeleccionada: string | null = null;

  departamentoId = this.authService.currentUser()?.departamentoId ?? null;

  /** Map nombre del slot → archivo subido (si existe). */
  archivosProducidos = new Map<string, ArchivoResponse>();

  form = this.fb.nonNullable.group({
    comentario: ['']
  });

  dynamicForm: FormGroup = this.fb.group({});

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.departamentoId) {
      this.loadingData = false;
      return;
    }

    this.solicitudesService.getTareasActivas(this.solicitud.id, this.departamentoId).subscribe({
      next: tareas => {
        this.tarea = tareas[0] ?? null;
        if (this.tarea) {
          // Excluimos FILE: los archivos ahora se gestionan por slots de producidos.
          this.campos = (this.tarea.campos ?? []).filter(c => c.tipo !== 'FILE');
          this.slots = this.tarea.documentosProducidos ?? [];
          this.buildDynamicForm(this.campos);
          this.cargarArchivosProducidos();
        }
        this.loadingData = false;
      },
      error: () => { this.loadingData = false; }
    });

    // Refrescar el mapa de producidos cuando el panel emita cambios.
    this.archivosService.changes$.pipe(takeUntil(this.destroy$)).subscribe(id => {
      if (id === this.solicitud.id) this.cargarArchivosProducidos();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Carga los archivos del expediente y arma el map por nombre de producido. */
  private cargarArchivosProducidos(): void {
    this.archivosService.listarPorSolicitud(this.solicitud.id).subscribe({
      next: archivos => {
        const map = new Map<string, ArchivoResponse>();
        for (const a of archivos) {
          if (a.estado === 'ACTIVO' && a.campoFormularioOrigen) {
            map.set(a.campoFormularioOrigen, a);
          }
        }
        this.archivosProducidos = map;
      }
    });
  }

  archivoDelSlot(slot: DocumentoProducidoSlot): ArchivoResponse | null {
    return this.archivosProducidos.get(slot.nombre) ?? null;
  }

  // ---- progreso de obligatorios ----

  get obligatoriosTotal(): number {
    return this.slots.filter(s => s.obligatorio).length;
  }

  get obligatoriosSubidos(): number {
    return this.slots.filter(s => s.obligatorio && this.archivosProducidos.has(s.nombre)).length;
  }

  get faltanObligatorios(): boolean {
    return this.obligatoriosSubidos < this.obligatoriosTotal;
  }

  // ---- form dinámico (sin FILE) ----

  private buildDynamicForm(campos: CampoFormulario[]): void {
    const group: Record<string, any> = {};
    for (const campo of campos) {
      // Valor inicial según el tipo (los complejos guardan array/objeto).
      // BOOLEAN = radio Sí/No sin preselección (null) → obliga a elegir si es requerido.
      let inicial: any = '';
      if (campo.tipo === 'BOOLEAN') inicial = null;
      else if (campo.tipo === 'CHECKBOX' || campo.tipo === 'TABLA') inicial = [];
      else if (campo.tipo === 'GRID') inicial = {};

      // El "required" de Material no aplica bien a CHECKBOX/TABLA/GRID (su valor es []/{}).
      const sinRequerido = ['CHECKBOX', 'TABLA', 'GRID'];
      const validators = (campo.requerido && !sinRequerido.includes(campo.tipo)) ? [Validators.required] : [];

      group[campo.nombre] = [inicial, validators];
    }
    this.dynamicForm = this.fb.group(group);
  }

  // ---- Helpers para tipos complejos (leen/escriben el control del dynamicForm) ----

  // CHECKBOX: el control guarda string[]
  checkboxMarcado(nombre: string, opcion: string): boolean {
    const arr = (this.dynamicForm.get(nombre)?.value ?? []) as string[];
    return arr.includes(opcion);
  }
  toggleCheckbox(nombre: string, opcion: string): void {
    const ctrl = this.dynamicForm.get(nombre);
    const arr = [...((ctrl?.value ?? []) as string[])];
    const i = arr.indexOf(opcion);
    if (i >= 0) arr.splice(i, 1); else arr.push(opcion);
    ctrl?.setValue(arr);
  }

  // GRID: el control guarda { fila: opcionElegida }
  gridValor(nombre: string, fila: string): string {
    return ((this.dynamicForm.get(nombre)?.value ?? {}) as Record<string, string>)[fila] ?? '';
  }
  setGridValor(nombre: string, fila: string, opcion: string): void {
    const ctrl = this.dynamicForm.get(nombre);
    const obj = { ...((ctrl?.value ?? {}) as Record<string, string>) };
    obj[fila] = opcion;
    ctrl?.setValue(obj);
  }

  // TABLA: el control guarda Array<{ [columna]: valor }>
  tablaFilas(nombre: string): Record<string, string>[] {
    return (this.dynamicForm.get(nombre)?.value ?? []) as Record<string, string>[];
  }
  agregarFilaTabla(nombre: string, columnas: string[]): void {
    const ctrl = this.dynamicForm.get(nombre);
    const filas = [...this.tablaFilas(nombre)];
    const nueva: Record<string, string> = {};
    columnas.forEach(col => (nueva[col] = ''));
    filas.push(nueva);
    ctrl?.setValue(filas);
  }
  quitarFilaTabla(nombre: string, index: number): void {
    const ctrl = this.dynamicForm.get(nombre);
    const filas = [...this.tablaFilas(nombre)];
    filas.splice(index, 1);
    ctrl?.setValue(filas);
  }
  celdaTabla(nombre: string, index: number, columna: string): string {
    return this.tablaFilas(nombre)[index]?.[columna] ?? '';
  }
  setCeldaTabla(nombre: string, index: number, columna: string, valor: string): void {
    const ctrl = this.dynamicForm.get(nombre);
    const filas = this.tablaFilas(nombre).map(f => ({ ...f }));
    if (filas[index]) filas[index][columna] = valor;
    ctrl?.setValue(filas);
  }

  /** ¿El valor serializado tiene contenido? (para no mandar campos vacíos). */
  private tieneValor(valorSerializado: string, tipo?: TipoCampo): boolean {
    if (tipo === 'CHECKBOX' || tipo === 'TABLA') return valorSerializado !== '[]';
    if (tipo === 'GRID') return valorSerializado !== '{}';
    // BOOLEAN: "true"/"false" se mandan; sin responder queda '' → se filtra.
    return valorSerializado !== '' && valorSerializado !== 'null';
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

    // Tipo por nombre de campo, para serializar cada valor en el formato correcto.
    const tipoPorCampo = new Map(this.campos.map(c => [c.nombre, c.tipo]));

    const respuestas: RespuestaCampo[] = Object.entries(dynamicValues)
      .map(([nombreCampo, valor]) => {
        const tipo = tipoPorCampo.get(nombreCampo);
        // Complejos → JSON string · BOOLEAN → "true"/"false" · resto → string
        if (tipo === 'CHECKBOX' || tipo === 'TABLA' || tipo === 'GRID') {
          return { nombreCampo, valor: JSON.stringify(valor ?? (tipo === 'GRID' ? {} : [])) };
        }
        return { nombreCampo, valor: String(valor ?? '') };
      })
      .filter(r => this.tieneValor(r.valor, tipoPorCampo.get(r.nombreCampo)));

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
      this.feedback.success('Respuesta del departamento registrada correctamente');
      this.dialogRef.close(true);
    } catch (err) {
      this.feedback.error(mapHttpErrorToUserMessage(err as HttpErrorResponse));
      this.saving = false;
    }
  }
}
