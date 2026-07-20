/**
 * @fileoverview Root application component
 * Serves as the shell component containing the navigation bar, toast notifications,
 * and router outlet. Manages user session state, token expiration watching,
 * and logout with audit logging.
 */

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject, OnDestroy, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ClientDTO } from '@models/client';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { ThemeService } from '@services/theme';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Single item in the sidenav menu */
interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxSonnerToaster,
    RouterLink,
    MatSlideToggleModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('LBRDC Billing System');
  protected readonly toast = toast;
  authService = inject(Auth);
  logService = inject(Log);
  themeService = inject(ThemeService);
  clientService = inject(Client);
  breakpointObserver = inject(BreakpointObserver);
  router = inject(Router);

  /** Current authenticated user profile, null if not logged in */
  user = signal<any>(null);
  /** All clients from the API used to build the sidenav menu */
  clients = signal<ClientDTO[]>([]);
  /** Whether the sidenav is currently open */
  sidenavOpened = signal(false);
  /** Whether the viewport is a mobile handset */
  isMobile = signal(false);

  private destroy$ = new Subject<void>();

  /** Dynamically built sidenav menu based on role and handled clients */
  readonly menuItems = computed<MenuItem[]>(() => {
    const user = this.user();
    const allClients = this.clients();
    if (!user) return [];

    const isAdmin = user.role === 'Admin';
    const allowedClients = isAdmin
      ? allClients.filter((c) => c.code !== 'ALL' && c.code !== 'NONE')
      : allClients.filter((c) => (user.handledClients || []).includes(c._id));

    const adminMenu: MenuItem[] = isAdmin
      ? [
          {
            label: 'Admin',
            icon: 'admin_panel_settings',
            children: [
              { label: 'Users', route: '/admin/user/list', icon: 'people' },
              { label: 'Pay Frequencies', route: '/admin/payfreq/list', icon: 'calendar_today' },
              { label: 'Clients', route: '/admin/client/list', icon: 'business' },
              { label: 'Logs', route: '/admin/log/list', icon: 'history' },
              { label: 'Backup & Restore', route: '/admin/backup', icon: 'restore' }
            ]
          }
        ]
      : [];

    const excludedRateManpowerClients = ['ACID', 'SPAD', 'JSS']
    const billingClients = allowedClients
    const rateManpowerClients = allowedClients.filter(
      (c) => !excludedRateManpowerClients.includes(c.code)
    )

    const billingChildren = billingClients.map((c) => ({
      label: c.code,
      children: [
        { label: 'Create Letter', route: `/billing/letter/editor/${c.code}`, icon: 'description' },
        { label: 'Generate Billing', route: `/billing/${c.code.toLowerCase()}/generate`, icon: 'picture_as_pdf' },
        { label: 'Billing List', route: `/billing/${c.code.toLowerCase()}/list`, icon: 'list' }
      ]
    }));

    const manpowerChildren = rateManpowerClients.map((c) => ({
      label: c.code,
      children: [
        { label: 'Add Employee', route: `/manpower/${c.code}/add`, icon: 'person_add' },
        { label: 'Manage Manpower', route: `/manpower/${c.code}/list`, icon: 'people' }
      ]
    }));

    const ratesChildren = rateManpowerClients.map((c) => ({
      label: c.code,
      route: `/rates/${c.code}/list`,
      icon: 'attach_money'
    }));

    return [
      { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
      ...adminMenu,
      ...(billingChildren.length ? [{ label: 'Billing', icon: 'request_quote', children: billingChildren }] : []),
      ...(manpowerChildren.length ? [{ label: 'Manpower', icon: 'badge', children: manpowerChildren }] : []),
      ...(ratesChildren.length ? [{ label: 'Rates', icon: 'attach_money', children: ratesChildren }] : [])
    ];
  });

  /** Starts token expiration watcher, loads user profile/clients, and sets up responsive sidenav */
  ngOnInit(): void {
    this.isMobile.set(this.breakpointObserver.isMatched(Breakpoints.Handset));
    this.sidenavOpened.set(!this.isMobile());

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        this.sidenavOpened.update(() => !result.matches);
      });

    if (this.authService.hasValidToken()) {
      this.authService.startTokenWatcher();
      this.loadData();
    }
  }

  /** Cleans up token watcher timeout and breakpoint subscription to prevent memory leaks */
  ngOnDestroy(): void {
    this.authService.clearTokenWatcher();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Fetches the current user's profile and the client list in parallel */
  private async loadData() {
    try {
      const [profile, clients] = await Promise.all([
        this.authService.getProfile(),
        this.clientService.allList()
      ]);
      this.user.set(profile);
      this.clients.set(clients);
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  }

  /** Returns the appropriate home route based on authentication state */
  home() {
    if (this.authService.hasValidToken()) {
      return '/dashboard';
    }
    else {
      return '/';
    }
  }

  /** Toggles the sidenav open/closed state */
  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }

  /** Closes the sidenav after a navigation click on mobile */
  closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

  /** Logs the logout operation, clears the session, and redirects to home */
  async logout() {
    try {
      const logObject: LogDTO = {
        operation: 'Logged Out'
      };
      await this.logService.create(logObject);

      await this.authService.logout();
      this.user.set(null);
      this.clients.set([]);
      this.sidenavOpened.set(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.log(error);
    }
  }
}
