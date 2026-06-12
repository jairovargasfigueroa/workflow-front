import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import {
  ChatMensaje,
  EventoSSE,
  HerramientaEjecutada,
  SUGERENCIAS_RAPIDAS,
  inferirTipoArchivo
} from '../../models/chat.model';
import { ReportesChatService } from '../../services/reportes-chat.service';
import { ChatMessageComponent } from '../../components/chat-message/chat-message';
import { ChatInputComponent } from '../../components/chat-input/chat-input';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ChatMessageComponent,
    ChatInputComponent
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements AfterViewChecked, OnDestroy {
  private readonly chatService = inject(ReportesChatService);

  @ViewChild('scrollContainer') private scrollContainerRef?: ElementRef<HTMLDivElement>;

  readonly mensajes = signal<ChatMensaje[]>([]);
  readonly streamActivo = signal(false);
  readonly sesionId = signal<string>(this.nuevoSesionId());
  readonly sugerencias = SUGERENCIAS_RAPIDAS;

  private streamSub: Subscription | null = null;
  private autoScrollPending = false;
  private prevCount = 0;

  ngAfterViewChecked(): void {
    if (this.autoScrollPending && this.scrollContainerRef) {
      this.scrollContainerRef.nativeElement.scrollTop =
        this.scrollContainerRef.nativeElement.scrollHeight;
      this.autoScrollPending = false;
    }
    if (this.mensajes().length !== this.prevCount) {
      this.prevCount = this.mensajes().length;
      this.autoScrollPending = true;
    }
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  nuevaConversacion(): void {
    if (this.streamActivo()) this.streamSub?.unsubscribe();
    this.streamActivo.set(false);
    this.mensajes.set([]);
    this.sesionId.set(this.nuevoSesionId());
  }

  onEnviar(texto: string): void {
    if (this.streamActivo() || !texto.trim()) return;

    const userMsg: ChatMensaje = {
      id: this.nuevoId(),
      rol: 'usuario',
      texto: texto.trim(),
      herramientas: [],
      archivos: [],
      estado: 'completo',
      timestamp: Date.now()
    };

    const agenteMsg: ChatMensaje = {
      id: this.nuevoId(),
      rol: 'agente',
      texto: '',
      herramientas: [],
      archivos: [],
      estado: 'streaming',
      timestamp: Date.now()
    };

    this.mensajes.update(arr => [...arr, userMsg, agenteMsg]);
    this.autoScrollPending = true;
    this.streamActivo.set(true);

    this.streamSub = this.chatService.enviarMensaje(this.sesionId(), texto.trim()).subscribe({
      next: evento => this.aplicarEvento(agenteMsg.id, evento),
      error: () => this.cerrarStreamConError(agenteMsg.id, 'No se pudo procesar la solicitud.'),
      complete: () => {
        this.streamActivo.set(false);
        this.actualizarMensaje(agenteMsg.id, m => {
          if (m.estado === 'streaming') m.estado = 'completo';
          return m;
        });
      }
    });
  }

  private aplicarEvento(agenteMsgId: string, evento: EventoSSE): void {
    switch (evento.tipo) {
      case 'tool_call':
        this.actualizarMensaje(agenteMsgId, m => {
          const nueva: HerramientaEjecutada = {
            nombre: evento.nombre,
            estado: 'ejecutando',
            resumen: null
          };
          m.herramientas = [...m.herramientas, nueva];
          return m;
        });
        break;

      case 'tool_result':
        this.actualizarMensaje(agenteMsgId, m => {
          // Marcamos completada la primera herramienta con ese nombre que aún esté en curso.
          const idx = m.herramientas.findIndex(
            h => h.nombre === evento.nombre && h.estado === 'ejecutando'
          );
          if (idx >= 0) {
            const copia = [...m.herramientas];
            copia[idx] = { ...copia[idx], estado: 'completada', resumen: evento.resumen };
            m.herramientas = copia;
          } else {
            m.herramientas = [
              ...m.herramientas,
              { nombre: evento.nombre, estado: 'completada', resumen: evento.resumen }
            ];
          }
          return m;
        });
        break;

      case 'texto':
        this.actualizarMensaje(agenteMsgId, m => {
          m.texto = m.texto + evento.contenido;
          return m;
        });
        break;

      case 'archivo_listo':
        this.actualizarMensaje(agenteMsgId, m => {
          m.archivos = [
            ...m.archivos,
            {
              url: evento.url,
              nombre: evento.nombre,
              tipoArchivo: evento.tipoArchivo ?? inferirTipoArchivo(evento.nombre)
            }
          ];
          return m;
        });
        break;

      case 'error':
        this.cerrarStreamConError(agenteMsgId, evento.mensaje);
        break;

      case 'fin':
        // El observable se completará solo; no hacemos nada aquí.
        break;
    }
    this.autoScrollPending = true;
  }

  private cerrarStreamConError(agenteMsgId: string, mensaje: string): void {
    this.actualizarMensaje(agenteMsgId, m => {
      m.estado = 'error';
      m.errorMensaje = mensaje;
      return m;
    });
    this.streamActivo.set(false);
  }

  private actualizarMensaje(id: string, mutador: (m: ChatMensaje) => ChatMensaje): void {
    this.mensajes.update(arr =>
      arr.map(m => (m.id === id ? mutador({ ...m }) : m))
    );
  }

  private nuevoId(): string {
    return crypto.randomUUID();
  }

  private nuevoSesionId(): string {
    return crypto.randomUUID();
  }
}
