import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { User } from '@services/user';
import { Create } from './create';

describe('Create user form', () => {
  let fixture: ComponentFixture<Create>;
  let component: Create;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Create],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Auth, useValue: { fetchUser: vi.fn() } },
        { provide: Client, useValue: { list: vi.fn(async () => []) } },
        { provide: Log, useValue: { create: vi.fn(async () => undefined) } },
        { provide: User, useValue: { create: vi.fn(async () => undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Create);
    component = fixture.componentInstance;
    component.clients.set([
      { _id: 'all', code: 'ALL', name: 'All Clients' },
      { _id: 'acid', code: 'ACID', name: 'ACID' },
      { _id: 'none', code: 'NONE', name: 'None' },
    ]);
  });

  it('keeps handled clients disabled until a role is selected', () => {
    component.syncHandledClients();

    expect(component.form.controls.handledClients.disabled).toBe(true);
    expect(component.form.controls.handledClients.value).toEqual([]);
  });

  it('enables specific client selection for a User role', () => {
    component.form.controls.role.setValue('User');
    component.syncHandledClients();

    expect(component.form.controls.handledClients.enabled).toBe(true);
    expect(component.form.controls.handledClients.value).toEqual([]);
  });

  it('clears and locks client selection for an Admin role', () => {
    component.form.controls.role.setValue('Admin');
    component.syncHandledClients();

    expect(component.form.controls.handledClients.disabled).toBe(true);
    expect(component.form.controls.handledClients.value).toEqual([]);
  });
});
