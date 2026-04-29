import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PublishErrorsDialogData {
  errores: string[];
}

@Component({
  selector: 'app-publish-errors-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './publish-errors-dialog.html',
  styleUrl: './publish-errors-dialog.scss'
})
export class PublishErrorsDialogComponent {
  readonly data = inject<PublishErrorsDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PublishErrorsDialogComponent>);
}
