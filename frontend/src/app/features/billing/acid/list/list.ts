import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
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
    MatTooltipModule,

  ],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit{
  billingService = inject(Billing)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  billingList = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)
  loading = signal(true)
  user = signal<any>({})

  private debounceTimer: any
  columns = ['billingLetter', 'createdBy', 'createdAt', 'actions']

  constructor() {
    effect(() => {
      const value = this.searchInput()

      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.searchQuery.set(value)
        this.currentPage.set(1)
      }, 300)
    })
  }

  filteredBillings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.billingList();

    return this.billingList().filter(b =>
      b.createdAt.toLowerCase().includes(q) ||
      b.createdBy.name.toLowerCase().includes(q) ||
      b.billingLetter.toLowerCase().includes(q)
    )
  })

  paginatedBillings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredBillings().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  async load() {
    const acidBillingList = await this.billingService.acidBillingList()
    this.billingList.set(acidBillingList)
    for (let i = 0; i < this.billingList().length; i++) {
      const newDate = new Date(this.billingList()[i].createdAt).toDateString();
      this.billingList()[i].createdAt = newDate
    }
    const userDetails = this.authService.getProfile()
    this.user.set(userDetails)
    this.loading.set(false)
  }

  view(b: any) { this.router.navigate(['billing/acid/view', b._id]) }

  async delete(b: any) {
    if(!confirm('Are you sure you want to delete this billing? This is action is permanent.')) return;
    await this.billingService.deleteAcidBilling(b._id)
    toast.success('Deleted ACID Billing successfully')
    await this.load()

    const log: LogDTO = {
      user: this.authService.fetchUser() ?? '',
      operation: 'Deleted Client'
    }

    await this.logService.create(log)
  }

  totalPages() { return Math.ceil(this.filteredBillings().length / this.pageSize()) }

  gotoPage(page:number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }
}
