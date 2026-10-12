import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;

  const authStub = {
    getProfile: vi.fn(async () => ({ role: 'User', handledClients: ['btr'] })),
  };

  const clientStub = {
    allList: vi.fn(async () => [
      { _id: 'acid', code: 'ACID', name: 'ACID', payFreq: 'monthly' },
      { _id: 'btr', code: 'BTR', name: 'BTR', payFreq: 'monthly' },
      { _id: 'ofbank', code: 'OFBANK', name: 'OFBANK', payFreq: 'monthly' },
    ]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Auth, useValue: authStub },
        { provide: Client, useValue: clientStub },
        { provide: Log, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
  });

  it('shows only workspaces assigned to a regular user', () => {
    fixture.componentInstance.user.set({ role: 'User', handledClients: ['btr'] });
    fixture.componentInstance.clients.set([
      { _id: 'acid', code: 'ACID', name: 'ACID', payFreq: 'monthly' },
      { _id: 'btr', code: 'BTR', name: 'BTR', payFreq: 'monthly' },
      { _id: 'ofbank', code: 'OFBANK', name: 'OFBANK', payFreq: 'monthly' },
    ]);

    expect(fixture.componentInstance.billingClients().map((client) => client.code)).toEqual(['BTR']);
    expect(fixture.componentInstance.manpowerClients().map((client) => client.code)).toEqual(['BTR']);
  });

  it('navigates when an administration action is selected', () => {
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.openAction('/admin/user/list');

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/user/list');
  });

  it('shows a loading state until account access and client workspaces are ready', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Preparing your workspace');
    expect(text).not.toContain('No billing workspaces are assigned');
  });
});
