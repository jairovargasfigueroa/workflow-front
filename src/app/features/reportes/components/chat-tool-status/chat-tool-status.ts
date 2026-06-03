import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HerramientaEjecutada } from '../../models/chat.model';

@Component({
  selector: 'app-chat-tool-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './chat-tool-status.html',
  styleUrl: './chat-tool-status.scss'
})
export class ChatToolStatusComponent {
  @Input({ required: true }) herramienta!: HerramientaEjecutada;
}
