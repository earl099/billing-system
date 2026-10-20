import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { Confirmation } from './confirmation';

describe('Confirmation', () => {
  const dialog = {
    open: vi.fn(() => ({ afterClosed: () => of(true) })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [Confirmation, { provide: MatDialog, useValue: dialog }],
    });
  });

  it('resolves true only after the dialog is confirmed', async () => {
    const confirmation = TestBed.inject(Confirmation);

    await expect(confirmation.confirm('Delete this record?')).resolves.toBe(true);
    expect(dialog.open).toHaveBeenCalledOnce();
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      panelClass: 'app-confirmation-dialog-panel',
      width: 'min(26rem, calc(100vw - 2rem))',
    }));
  });
});
