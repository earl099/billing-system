/**
 * @fileoverview Billing operations list component
 * Displays a paginated, searchable table of generated billing records
 * with view, download, and delete actions. Logs delete operations.
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-list',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  billingService = inject(Billing)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  route = inject(ActivatedRoute)

  code = signal(this.route.snapshot.paramMap.get('code') ?? '')
  billingList = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)
  loading = signal(true)
  user = signal<any>({})

  /** Debounce timer for search input */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  columns = ['billingLetter', 'createdBy', 'createdAt', 'actions']

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

  /** Computed filtered billing list based on search query */
  filteredBillings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.billingList();

    return this.billingList().filter(b =>
      b.createdAt?.toLowerCase().includes(q) ||
      b.createdBy?.name?.toLowerCase().includes(q) ||
      b.billingLetter?.toLowerCase().includes(q)
    )
  })

  /** Computed paginated subset of filtered billings */
  paginatedBillings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredBillings().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    if (!this.code()) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.load()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  /** Fetches billing records and formats dates for display */
  async load() {
    try {
      this.loading.set(true)
      const billingListData = await this.billingService.billingList(this.code())
      
      const processedList = billingListData.map((item: any) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt).toDateString() : 'N/A'
      }))
      
      this.billingList.set(processedList)
      const userDetails = await this.authService.getProfile()
      this.user.set(userDetails)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load billings'
      toast.error(errorMessage)
    } finally {
      this.loading.set(false)
    }
  }

  /** Navigates to the billing detail view */
  view(b: any) {
    if (!b?._id) {
      toast.error('Invalid billing record')
      return
    }
    this.router.navigate(['billing', this.code(), 'view', b._id])
  }

  /** Deletes a billing record with confirmation and audit logging */
  async delete(b: any) {
    if (!b?._id) {
      toast.error('Invalid billing record')
      return
    }
    if(!confirm('Are you sure you want to delete this billing? This action is permanent.')) return;
    
    try {
      await this.billingService.deleteBilling(b._id, this.code())
      toast.success('Deleted billing successfully')
      
      const log: LogDTO = {
        operation: 'Deleted Billing'
      }
      await this.logService.create(log)
      await this.load()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete billing'
      toast.error(errorMessage)
    }
  }

  totalPages() { return Math.ceil(this.filteredBillings().length / this.pageSize()) }

  gotoPage(page: number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }

  /** Navigates to the billing generation form */
  generate() {
    this.router.navigate(['billing', this.code(), 'generate'])
  }
}
