import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { SpeechService } from '../../../../core/services/speech.service';

const VOICE_TARGET = 'chat-reportes';

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
export class ChatInputComponent implements OnChanges, OnDestroy {
  @Input() bloqueado = false;
  @Output() enviar = new EventEmitter<string>();

  private readonly speechService = inject(SpeechService);

  readonly texto = signal('');
  readonly soportaVoz = this.speechService.soportado;

  /** True solo cuando este chat es el que está dictando (no si otro componente usa el service). */
  readonly dictando = computed(() => this.speechService.escuchando() === VOICE_TARGET);

  readonly micTooltip = computed(() => {
    if (!this.soportaVoz) return 'Tu navegador no soporta dictado por voz';
    if (this.bloqueado) return 'Esperá a que el agente responda';
    if (this.dictando()) return 'Detener dictado';
    return 'Dictar mensaje';
  });

  private voiceSub: Subscription | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Si el chat empieza a procesar mientras estamos dictando, cortamos la escucha.
    if (changes['bloqueado'] && this.bloqueado && this.dictando()) {
      this.speechService.stop();
      this.voiceSub?.unsubscribe();
      this.voiceSub = null;
    }
  }

  ngOnDestroy(): void {
    // Si el usuario navega de /reportes mientras dicta, frenamos la escucha.
    if (this.dictando()) this.speechService.stop();
    this.voiceSub?.unsubscribe();
  }

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

  toggleDictado(): void {
    if (this.bloqueado || !this.soportaVoz) return;

    // Si ya está dictando, listen() con el mismo target lo apaga (toggle interno del service).
    if (this.dictando()) {
      this.speechService.stop();
      this.voiceSub?.unsubscribe();
      this.voiceSub = null;
      return;
    }

    // Arranca escucha; concatena el transcript al texto existente.
    this.voiceSub?.unsubscribe();
    this.voiceSub = this.speechService.listen(VOICE_TARGET).subscribe(transcript => {
      const actual = this.texto();
      const nuevo = actual ? `${actual} ${transcript}` : transcript;
      this.texto.set(nuevo);
    });
  }
}
