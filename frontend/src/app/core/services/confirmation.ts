import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ConfirmationDialog, ConfirmationDialogData } from '../../shared/confirmation-dialog/confirmation-dialog';

@Injectable({ providedIn: 'root' })
export class Confirmation {
  private readonly dialog = inject(MatDialog);

  async confirm(message: string, options: Omit<ConfirmationDialogData, 'message'> = {}): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      autoFocus: 'first-tabbable',
      backdropClass: 'app-confirmation-backdrop',
      data: { message, ...options },
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'app-confirmation-dialog-panel',
      restoreFocus: true,
      width: 'min(26rem, calc(100vw - 2rem))',
    });

    return Boolean(await firstValueFrom(dialogRef.afterClosed()));
  }
}
