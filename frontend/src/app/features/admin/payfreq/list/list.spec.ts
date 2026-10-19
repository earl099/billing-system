import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { Payfreq } from '@services/payfreq';
import { List } from './list';

describe('Pay frequency list', () => {
  let fixture: ComponentFixture<List>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [List],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Auth, useValue: { fetchUser: vi.fn() } },
        { provide: Client, useValue: { list: vi.fn(async () => []) } },
        { provide: Log, useValue: { create: vi.fn(async () => undefined) } },
        { provide: Payfreq, useValue: { list: vi.fn(async () => []), delete: vi.fn(async () => undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
  });

  it('shows a loading state while pay frequencies are being retrieved', async () => {
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.pay-frequency-table-loading')).toBeTruthy();
  });
});
