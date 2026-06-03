import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SUGERENCIAS_RAPIDAS } from '../../models/chat.model';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss'
})
export class ChatInputComponent {
  @Input() bloqueado = false;
  @Input() mostrarSugerencias = false;
  @Output() enviar = new EventEmitter<string>();

  readonly sugerencias = SUGERENCIAS_RAPIDAS;
  readonly texto = signal('');

  get puedeEnviar(): boolean {
    return !this.bloqueado && this.texto().trim().length > 0;
  }

  onTextoChange(value: string): void {
    this.texto.set(value);
  }

  onEnter(event: Event): void {
    const kb = event as KeyboardEvent;
    if (kb.shiftKey) return; // Shift+Enter = nueva línea
    event.preventDefault();
    this.intentarEnviar();
  }

  intentarEnviar(): void {
    if (!this.puedeEnviar) return;
    const msg = this.texto().trim();
    this.enviar.emit(msg);
    this.texto.set('');
  }

  usarSugerencia(s: string): void {
    if (this.bloqueado) return;
    this.enviar.emit(s);
    this.texto.set('');
  }
}
