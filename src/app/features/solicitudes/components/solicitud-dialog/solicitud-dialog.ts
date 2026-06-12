import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';

import { SolicitudesService } from '../../services/solicitudes.service';
import { ArchivosService } from '../../services/archivos.service';
import { DocumentoProducidoSlot, RespuestaCampo, SolicitudTramite } from '../../models/solicitud.model';
import { TramitesService } from '../../../tramites/services/tramites.service';
import { FormulariosService } from '../../../formularios/services/formularios.service';
import { Tramite } from '../../../tramites/models/tramite.model';
import { FormularioTemplate, CampoFormulario } from '../../../formularios/models/formulario.model';
import { TipoCampo } from '../../../../core/models';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { mapHttpErrorToUserMessage } from '../../../../core/utils/http-error.util';
import { DocKitSlotComponent } from '../doc-kit-slot/doc-kit-slot';

interface SlotEstado {
  subiendo: boolean;
  subido: boolean;
  error: string | null;
}

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
    MatDatepickerModule,
    MatRadioModule,
    MatCheckboxModule,
    DocKitSlotComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './solicitud-dialog.html',
  styleUrl: './solicitud-dialog.scss'
})
export class SolicitudDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SolicitudDialogComponent>);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly archivosService = inject(ArchivosService);
  private readonly tramitesService = inject(TramitesService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly feedback = inject(FeedbackService);

  saving = false;
  cargandoTramite = false;

  tramites: Tramite[] = [];
  formulario: FormularioTemplate | null = null;
  campos: CampoFormulario[] = [];
  /** Documentos del kit (slots) declarados en el startEvent del flujo. */
  slots: DocumentoProducidoSlot[] = [];
  /** Archivos elegidos por el usuario (todavía no subidos). */
  archivosKit = new Map<string, File>();
  /** Estado por slot durante/después del envío. */
  estadosSlots = new Map<string, SlotEstado>();

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
    this.slots = [];
    this.archivosKit.clear();
    this.estadosSlots.clear();
    this.dynamicForm = this.fb.group({});

    const tramite = this.tramites.find(t => t.id === tramiteId);
    if (!tramite) return;

    this.cargandoTramite = true;

    // 1) Cargar formulario solicitante (si tiene)
    if (tramite.formularioSolicitanteId) {
      this.formulariosService.getById(tramite.formularioSolicitanteId).subscribe({
        next: form => {
          this.formulario = form;
          this.campos = form.campos.filter(c => c.tipo !== 'FILE'); // FILE ya no se renderiza en el form
          this.buildDynamicForm(this.campos);
        }
      });
    }

    // 2) Cargar documentos del kit (en paralelo con el formulario)
    this.tramitesService.getDocumentosKit(tramiteId).subscribe({
      next: kit => {
        this.slots = kit ?? [];
        this.cargandoTramite = false;
      },
      error: () => {
        // Si falla, asumimos que el trámite no requiere docs del kit.
        this.slots = [];
        this.cargandoTramite = false;
      }
    });
  }

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

  // ---- Slots del kit ----

  onArchivoSlot(slot: DocumentoProducidoSlot, file: File | null): void {
    if (file) {
      this.archivosKit.set(slot.nombre, file);
    } else {
      this.archivosKit.delete(slot.nombre);
    }
    // Si había un error previo en ese slot, lo limpiamos al cambiar el archivo.
    const estado = this.estadosSlots.get(slot.nombre);
    if (estado?.error) this.estadosSlots.set(slot.nombre, { subiendo: false, subido: false, error: null });
  }

  estadoSlot(slot: DocumentoProducidoSlot): SlotEstado {
    return this.estadosSlots.get(slot.nombre) ?? { subiendo: false, subido: false, error: null };
  }

  get obligatoriosFaltantes(): number {
    return this.slots.filter(s => s.obligatorio && !this.archivosKit.has(s.nombre)).length;
  }

  get obligatoriosTotal(): number {
    return this.slots.filter(s => s.obligatorio).length;
  }

  get puedeEnviar(): boolean {
    return !this.saving
      && !this.cargandoTramite
      && this.form.valid
      && this.dynamicForm.valid
      && this.obligatoriosFaltantes === 0;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (!this.puedeEnviar) return;

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

    // 1) Crear la solicitud
    let solicitud: SolicitudTramite;
    try {
      solicitud = await firstValueFrom(this.solicitudesService.create({
        tramiteId: formValue.tramiteId,
        respuestas
      }));
    } catch (err) {
      this.saving = false;
      const httpErr = err as HttpErrorResponse;
      const msg = httpErr.error?.message ?? '';
      if (httpErr.status === 400 && msg.toLowerCase().includes('activo')) {
        this.feedback.error('El flujo de trabajo de este trámite no está activo. Contacta al administrador.');
      } else {
        this.feedback.error(mapHttpErrorToUserMessage(httpErr));
      }
      return;
    }

    // 2) Subir los archivos del kit en paralelo
    const slotsConArchivo = this.slots.filter(s => this.archivosKit.has(s.nombre));
    if (slotsConArchivo.length === 0) {
      this.feedback.success('Solicitud creada correctamente');
      this.dialogRef.close(true);
      return;
    }

    // Marcar slots con archivo como "subiendo"
    for (const s of slotsConArchivo) {
      this.estadosSlots.set(s.nombre, { subiendo: true, subido: false, error: null });
    }

    const resultados = await Promise.allSettled(
      slotsConArchivo.map(s => firstValueFrom(this.archivosService.upload({
        archivo: this.archivosKit.get(s.nombre)!,
        solicitudId: solicitud.id,
        campoFormulario: s.nombre
      })))
    );

    // Aplicar resultados a los slots
    let hayError = false;
    resultados.forEach((res, i) => {
      const slot = slotsConArchivo[i];
      if (res.status === 'fulfilled') {
        this.estadosSlots.set(slot.nombre, { subiendo: false, subido: true, error: null });
      } else {
        hayError = true;
        const msg = mapHttpErrorToUserMessage(res.reason as HttpErrorResponse);
        this.estadosSlots.set(slot.nombre, { subiendo: false, subido: false, error: msg });
      }
    });

    if (hayError) {
      // Mantener el dialog abierto para que el usuario reintente solo los fallidos.
      this.saving = false;
      this.feedback.warn('La solicitud se creó, pero algunos documentos del kit fallaron. Reintenta los marcados en rojo.');
      return;
    }

    this.feedback.success('Solicitud y documentos enviados correctamente');
    this.dialogRef.close(true);
  }
}
