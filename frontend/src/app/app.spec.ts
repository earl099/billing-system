import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { ThemeService } from '@services/theme';
import { App } from './app';

/**
 * Shell component tests.
 *
 * App is the application shell: sidenav navigation built from the user's role
 * and handled clients, a router outlet, and session/theme wiring. This spec
 * previously came from the `ng new` scaffold and asserted a "Hello, frontend"
 * heading that the shell never rendered, so it could not pass.
 */
describe('App', () => {
  let fixture: ComponentFixture<App>;

  // jsdom does not implement matchMedia, which ngx-sonner's toaster reads while
  // it prefers dark/light mode. Polyfilled here rather than globally, so no
  // other suite inherits the override.
  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    }
  });

  const authStub = {
    token: signal<string | null>(null),
    hasValidToken: vi.fn(() => false),
    startTokenWatcher: vi.fn(),
    clearTokenWatcher: vi.fn(),
    getProfile: vi.fn(async () => ({ role: 'User', handledClients: [] as string[] })),
    logout: vi.fn(async () => undefined),
  };

  const clientStub = {
    allList: vi.fn(async () => [] as any[]),
  };

  const logStub = {
    create: vi.fn(async () => undefined),
  };

  const themeStub = {
    darkMode: signal(false),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authStub.token.set(null);
    authStub.hasValidToken.mockReturnValue(false);
    authStub.getProfile.mockResolvedValue({ role: 'User', handledClients: [] } as any);
    clientStub.allList.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Auth, useValue: authStub },
        { provide: Client, useValue: clientStub },
        { provide: Log, useValue: logStub },
        { provide: ThemeService, useValue: themeStub },
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => false,
            observe: () => of({ matches: false, breakpoints: {} }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('creates the shell', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the application title', async () => {
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('LBRDC Billing System');
  });

  it('renders the router outlet', async () => {
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeTruthy();
  });

  describe('session state', () => {
    it('does not start the token watcher or load data when signed out', async () => {
      authStub.hasValidToken.mockReturnValue(false);

      await fixture.whenStable();

      expect(authStub.startTokenWatcher).not.toHaveBeenCalled();
      expect(clientStub.allList).not.toHaveBeenCalled();
    });

    it('clears the token watcher on destroy', async () => {
      await fixture.whenStable();
      fixture.destroy();

      expect(authStub.clearTokenWatcher).toHaveBeenCalled();
    });
  });

  describe('sidenav menu', () => {
    it('is empty while signed out', async () => {
      await fixture.whenStable();

      expect(fixture.componentInstance.menuItems()).toEqual([]);
    });

    it('hides client menus the user does not handle', async () => {
      authStub.hasValidToken.mockReturnValue(true);
      authStub.getProfile.mockResolvedValue({ role: 'User', handledClients: ['c1'] } as any);
      clientStub.allList.mockResolvedValue([
        { _id: 'c1', code: 'DOF', name: 'DOF' },
        { _id: 'c2', code: 'XYZ', name: 'XYZ' },
      ]);

      await fixture.whenStable();

      const items = fixture.componentInstance.menuItems();
      const billing = items.find((item: any) => item.label === 'Billing');
      const labels = billing?.children?.map((child: any) => child.label) ?? [];

      expect(labels).toContain('DOF');
      expect(labels).not.toContain('XYZ');
    });

    it('omits rate and manpower menus for the excluded clients', async () => {
      authStub.hasValidToken.mockReturnValue(true);
      authStub.getProfile.mockResolvedValue({ role: 'User', handledClients: ['c1'] } as any);
      clientStub.allList.mockResolvedValue([{ _id: 'c1', code: 'ACID', name: 'ACID' }]);

      await fixture.whenStable();

      const items = fixture.componentInstance.menuItems();

      expect(items.find((item: any) => item.label === 'Rates')).toBeUndefined();
      expect(items.find((item: any) => item.label === 'Manpower')).toBeUndefined();
    });

    it('exposes admin sections for an admin user', async () => {
      authStub.hasValidToken.mockReturnValue(true);
      authStub.getProfile.mockResolvedValue({ role: 'Admin', handledClients: [] } as any);
      clientStub.allList.mockResolvedValue([{ _id: 'c1', code: 'DOF', name: 'DOF' }]);

      await fixture.whenStable();

      const admin = fixture.componentInstance.menuItems().find((item: any) => item.label === 'Admin');
      const labels = admin?.children?.map((child: any) => child.label) ?? [];

      expect(labels).toContain('Users');
      expect(labels).toContain('Backup & Restore');
    });

    it('always offers a Dashboard entry once signed in', async () => {
      authStub.hasValidToken.mockReturnValue(true);
      authStub.getProfile.mockResolvedValue({ role: 'User', handledClients: [] } as any);

      await fixture.whenStable();

      const items = fixture.componentInstance.menuItems();

      expect(items[0].label).toBe('Dashboard');
      expect(items[0].route).toBe('/dashboard');
    });
  });
});