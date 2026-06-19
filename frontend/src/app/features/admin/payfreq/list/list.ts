/**
 * @fileoverview Admin pay frequency list component
 * Displays a paginated, searchable table of pay frequency types
 * with delete action that prevents deletion of frequencies in use by clients
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
import { Payfreq } from '@services/payfreq';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-payfreq-list',
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
  payFreqService = inject(Payfreq)
  authService = inject(Auth)
  logService = inject(Log)

  router = inject(Router)

  clients = signal<any[]>([])
  payFreqs = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  /** Debounce timer for search input */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  columns = ['payType', 'delete']

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

  /** Computed filtered pay frequency list based on search query */
  filteredPayFreqs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.payFreqs();

    return this.payFreqs().filter(p =>
      p.payType?.toLowerCase().includes(q)
    )
  })

  /** Computed paginated subset of filtered pay frequencies */
  paginatedPayFreqs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredPayFreqs().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  /** Fetches pay frequencies and clients (needed for usage check) */
  async load() {
    try {
      const payFreqList = await this.payFreqService.list()
      this.payFreqs.set(payFreqList)
      const clientList = await this.clientService.list()
      this.clients.set(clientList)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load data'
      toast.error(errorMessage)
    }
  }

  /**
   * Checks if a pay frequency is currently used by any client
   * Prevents deletion of pay frequencies that are still referenced
   * 
   * @param p - Pay frequency record to check
   * @returns true if at least one client references this pay frequency
   */
  isUsed(p: any): boolean {
    if (!p?._id) return false
    return this.clients().some(c => 
      Array.isArray(c.payFreq) && c.payFreq[0] === p._id
    )
  }

  /** Deletes a pay frequency with usage check, confirmation, and audit logging */
  async deletePayFreq(p: any) {
    if (!p?._id) {
      toast.error('Invalid pay frequency record')
      return
    }

    if (this.isUsed(p)) {
      toast.error('This Pay Frequency is used by a Client.')
      return
    }

    if(!confirm('Are you sure you want to delete this Pay Frequency? This action is permanent.')) return;
    
    try {
      await this.payFreqService.delete(p._id)
      toast.success('Pay Frequency deleted successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Deleted Pay Frequency'
      }

      await this.logService.create(log)
      await this.load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete pay frequency'
      toast.error(errorMessage)
    }
  }

  totalPages() {
    return Math.ceil(this.filteredPayFreqs().length / this.pageSize())
  }

  gotoPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()))
  }
}
