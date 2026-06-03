import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatMensaje } from '../../models/chat.model';
import { ChatToolStatusComponent } from '../chat-tool-status/chat-tool-status';
import { ChatFileCardComponent } from '../chat-file-card/chat-file-card';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ChatToolStatusComponent,
    ChatFileCardComponent,
    MarkdownPipe
  ],
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss'
})
export class ChatMessageComponent {
  @Input({ required: true }) mensaje!: ChatMensaje;

  get esUsuario(): boolean {
    return this.mensaje.rol === 'usuario';
  }

  get mostrarPensando(): boolean {
    return (
      this.mensaje.rol === 'agente' &&
      this.mensaje.estado === 'streaming' &&
      this.mensaje.texto.length === 0 &&
      this.mensaje.herramientas.length === 0 &&
      this.mensaje.archivos.length === 0
    );
  }
}
