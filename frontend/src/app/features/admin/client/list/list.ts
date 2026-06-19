/**
 * @fileoverview Admin client list component
 * Displays a paginated, searchable table of client organizations
 * with view, edit, and delete actions. Logs delete operations for audit trail.
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-client-list',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink
  ],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  clients = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  /** Debounce timer for search input to avoid excessive filtering */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  columns = ['code', 'name', 'actions']

  constructor() {
    effect(() => {
      const value = this.searchInput()

      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.searchQuery.set(value)
        this.currentPage.set(1)
      }, 300)
    })
  }

  /** Computed filtered client list based on search query (code or name) */
  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.clients();

    return this.clients().filter(c =>
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
    )
  })

  /** Computed paginated subset of filtered clients */
  paginatedClients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredClients().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  /** Fetches all clients from the API */
  async load() {
    try {
      const clientList = await this.clientService.list()
      this.clients.set(clientList)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load clients'
      toast.error(errorMessage)
    }
  }

  /** Navigates to the client detail view */
  view(c: any) {
    if (!c?._id) {
      toast.error('Invalid client record')
      return
    }
    this.router.navigate(['/admin/client', c._id])
  }

  /** Navigates to the client edit form */
  edit(c: any) {
    if (!c?._id) {
      toast.error('Invalid client record')
      return
    }
    this.router.navigate(['/admin/client', c._id, 'edit'])
  }

  /** Deletes a client with confirmation and audit logging */
  async delete(c: any) {
    if (!c?._id) {
      toast.error('Invalid client record')
      return
    }
    if(!confirm('Are you sure you want to delete this Client? This action is permanent.')) return;
    
    try {
      await this.clientService.delete(c._id)
      toast.success('Client deleted successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Deleted Client'
      }

      await this.logService.create(log)
      await this.load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete client'
      toast.error(errorMessage)
    }
  }

  totalPages() { return Math.ceil(this.filteredClients().length / this.pageSize()) }

  gotoPage(page: number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }
}
