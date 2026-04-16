import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  buttonLabel = input<string>('');
  buttonIcon = input<string>('add');

  buttonClick = output<void>();
}
