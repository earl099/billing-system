import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-list',
  imports: [...MATERIAL_MODULES, MatTableModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  private readonly billingService = inject(Billing)
  private readonly authService = inject(Auth)
  private readonly logService = inject(Log)
  readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)

  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? '')
  readonly billingList = signal<any[]>([])
  readonly loading = signal(true)
  readonly loadError = signal<string | null>(null)
  readonly pendingDeletion = signal<any | null>(null)
  readonly deleting = signal(false)
  readonly user = signal<any>({})
  readonly searchInput = signal('')
  readonly searchQuery = signal('')
  readonly currentPage = signal(1)
  readonly pageSize = signal(5)
  readonly columns = ['billingLetter', 'createdBy', 'createdAt', 'actions']
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

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

  readonly filteredBillings = computed(() => {
    const query = this.searchQuery().trim().toLowerCase()
    if (!query) return this.billingList()
    return this.billingList().filter((billing) =>
      String(billing?.createdAt ?? '').toLowerCase().includes(query) ||
      String(billing?.createdBy?.name ?? '').toLowerCase().includes(query) ||
      String(billing?.billingLetter ?? '').toLowerCase().includes(query)
    )
  })

  readonly paginatedBillings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredBillings().slice(start, start + this.pageSize())
  })

  async ngOnInit(): Promise<void> {
    if (!this.code()) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.load()
  }

  ngOnDestroy(): void { if (this.debounceTimer) clearTimeout(this.debounceTimer) }

  async load(): Promise<void> {
    this.loading.set(true)
    this.loadError.set(null)
    try {
      const [billingListData, userDetails] = await Promise.all([
        this.billingService.billingList(this.code()),
        this.authService.getProfile(),
      ])
      this.billingList.set((Array.isArray(billingListData) ? billingListData : []).map((item: any) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt).toDateString() : 'Not recorded',
      })))
      this.user.set(userDetails ?? {})
    } catch {
      this.billingList.set([])
      this.loadError.set('We could not load this billing history. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }

  view(billing: any): void {
    if (!billing?._id) {
      toast.error('Invalid billing record')
      return
    }
    this.router.navigate(['billing', this.code(), 'view', billing._id])
  }

  requestDelete(billing: any): void {
    if (!billing?._id) {
      toast.error('Invalid billing record')
      return
    }
    this.pendingDeletion.set(billing)
  }

  cancelDelete(): void { if (!this.deleting()) this.pendingDeletion.set(null) }

  async confirmDelete(): Promise<void> {
    const billing = this.pendingDeletion()
    if (!billing?._id || this.deleting()) return
    this.deleting.set(true)
    try {
      await this.billingService.deleteBilling(billing._id, this.code())
      await this.logService.create({ operation: 'Deleted Billing' } as LogDTO)
      toast.success('Billing record deleted successfully')
      this.pendingDeletion.set(null)
      await this.load()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete billing record'
      toast.error(message)
    } finally {
      this.deleting.set(false)
    }
  }

  totalPages(): number { return Math.ceil(this.filteredBillings().length / this.pageSize()) }
  gotoPage(page: number): void { this.currentPage.set(Math.min(Math.max(page, 1), Math.max(this.totalPages(), 1))) }
  generate(): void { this.router.navigate(['billing', this.code(), 'generate']) }
}
