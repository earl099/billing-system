/**
 * @fileoverview Authenticated dashboard for navigating administration, manpower, and billing workspaces.
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ClientDTO } from '@models/client';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client } from '@services/client';

interface DashboardAction {
  label: string;
  route: string;
  icon: string;
}

const MANPOWER_CLIENT_CODES = new Set(['BTR', 'OFBANK', 'DOF', 'UNACOM']);
const EXCLUDED_CLIENT_CODES = new Set(['ALL', 'NONE']);

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly clientService = inject(Client);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  readonly user = signal<UserDTO | null>(null);
  readonly clients = signal<ClientDTO[]>([]);
  readonly loading = signal(true);
  readonly expandedWorkspace = signal<string | null>(null);

  readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  readonly billingClients = computed(() => {
    const user = this.user();
    const clients = this.clients().filter((client) => !EXCLUDED_CLIENT_CODES.has(client.code));

    if (user?.role === 'Admin') {
      return clients;
    }

    const handledClientIds = new Set(user?.handledClients ?? []);
    return clients.filter((client) => client._id && handledClientIds.has(client._id));
  });
  readonly manpowerClients = computed(() =>
    this.billingClients().filter((client) => MANPOWER_CLIENT_CODES.has(client.code)),
  );
  readonly adminActions: DashboardAction[] = [
    { label: 'Manage Users', route: '/admin/user/list', icon: 'group' },
    { label: 'Manage Pay Frequencies', route: '/admin/payfreq/list', icon: 'calendar_month' },
    { label: 'Manage Clients', route: '/admin/client/list', icon: 'business' },
    { label: 'View Logs', route: '/admin/log/list', icon: 'description' },
  ];

  /** Loads the authenticated user's profile and the list of accessible client workspaces. */
  async ngOnInit(): Promise<void> {
    try {
      const [user, clients] = await Promise.all([
        this.authService.getProfile(),
        this.clientService.allList(),
      ]);

      this.user.set(user);
      this.clients.set(clients);
    } finally {
      this.loading.set(false);
    }
  }

  /** Opens or closes the available actions for one workspace. */
  toggleWorkspace(workspace: string): void {
    this.expandedWorkspace.update((current) => (current === workspace ? null : workspace));
  }

  /** Opens an administration or workspace action from its dashboard card. */
  openAction(route: string): void {
    void this.router.navigateByUrl(route);
  }

  workspaceKey(section: 'manpower' | 'billing', client: ClientDTO): string {
    return `${section}-${client._id ?? client.code}`;
  }

  manpowerActions(client: ClientDTO): DashboardAction[] {
    const code = client.code.toLowerCase();
    return [
      { label: 'Add Employee', route: `/manpower/${code}/add`, icon: 'person_add' },
      { label: 'Manage Manpower Details', route: `/manpower/${code}/list`, icon: 'groups' },
      { label: 'Manage Billing Rates', route: `/rates/${code}/list`, icon: 'payments' },
    ];
  }

  billingActions(client: ClientDTO): DashboardAction[] {
    const code = client.code.toLowerCase();

    if (client.code === 'BTR') {
      return [
        { label: 'Create MISS SOA', route: '/billing/soa/btr/create/miss', icon: 'note_add' },
        { label: 'Create Janitorial SOA', route: '/billing/soa/btr/create/janitorial', icon: 'note_add' },
        { label: 'Create Monthly Supplies SOA', route: '/billing/soa/btr/create/supplies', icon: 'note_add' },
        { label: 'Billing List', route: '/billing/btr/list', icon: 'format_list_bulleted' },
      ];
    }

    if (client.code === 'OFBANK') {
      return [
        { label: 'Create SOA', route: '/billing/soa/ofbank/create/manpower', icon: 'note_add' },
        { label: 'Create Monthly Supplies Billing', route: '/billing/soa/ofbank/create/monthly-supplies', icon: 'note_add' },
        { label: 'Create Billing Letter', route: '/billing/letter/editor/ofbank', icon: 'description' },
        { label: 'Generate Billing', route: '/billing/ofbank/generate', icon: 'picture_as_pdf' },
        { label: 'Billing List', route: '/billing/soa/ofbank/list', icon: 'format_list_bulleted' },
      ];
    }

    if (client.code === 'UNACOM') {
      return [
        { label: 'Create SOA', route: '/billing/soa/unacom/create/manpower', icon: 'note_add' },
        { label: 'Create Billing Letter', route: `/billing/letter/editor/${code}`, icon: 'description' },
        { label: 'Generate Billing', route: `/billing/${code}/generate`, icon: 'picture_as_pdf' },
        { label: 'Billing List', route: `/billing/${code}/list`, icon: 'format_list_bulleted' },
      ];
    }

    if (client.code === 'DOF') {
      return [
        { label: 'Create DOF Timekeeping', route: '/billing/soa/dof/timekeeping', icon: 'schedule' },
        { label: 'Create DOF Billing', route: '/billing/soa/dof/billing', icon: 'receipt_long' },
      ];
    }

    if (client.code === 'DEPDEV') {
      return [
        { label: 'Create CO Billing', route: '/billing/soa/depdev/create/co', icon: 'note_add' },
        { label: 'Create IV-A Billing', route: '/billing/soa/depdev/create/iva', icon: 'note_add' },
        { label: 'Billing List', route: '/billing/depdev/list', icon: 'format_list_bulleted' },
      ];
    }

    return [
      { label: 'Create Billing Letter', route: `/billing/letter/editor/${code}`, icon: 'description' },
      { label: 'Generate Billing', route: `/billing/${code}/generate`, icon: 'picture_as_pdf' },
      { label: 'Billing List', route: `/billing/${code}/list`, icon: 'format_list_bulleted' },
    ];
  }
}
