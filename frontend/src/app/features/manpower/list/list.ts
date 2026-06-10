import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';
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
  manpowerService = inject(Manpower)
  route = inject(ActivatedRoute)
  router = inject(Router)

  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? '')
  data = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)
  loading = signal(true)

  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  displayedColumns = [
    'empNo',
    'name',
    'posCode',
    'posName',
    'dept',
    'actions'
  ]

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

  filteredManpower = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.data();

    return this.data().filter(d =>
      d.empNo?.toLowerCase().includes(q) ||
      d.name?.toLowerCase().includes(q) ||
      d.posCode?.toLowerCase().includes(q) ||
      d.posName?.toLowerCase().includes(q) ||
      d.dept?.toLowerCase().includes(q)
    )
  })

  paginatedManpower = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredManpower().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    if (!this.code()) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.loadData()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  async loadData() {
    try {
      this.loading.set(true)
      const dataSource = await this.manpowerService.listData(this.code(), 'BILLING-TEMPLATE.xlsm', 'EmployeeTable')
      const formattedData = []

      for(let i = 0; i < dataSource.length; i++) {
        const obj: any = { index: dataSource[i].index }

        for (let j = 0; j < this.displayedColumns.length - 1; j++) {
          obj[this.displayedColumns[j]] = dataSource[i].values[j] ?? ''
        }
        formattedData.push(obj)
      }
      this.data.set(formattedData)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load manpower data'
      toast.error(errorMessage)
    } finally {
      this.loading.set(false)
    }
  }

  view(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['manpower', this.code(), d.index, 'view'])
  }

  edit(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['manpower', this.code(), d.index, 'edit'])
  }

  async delete(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    if(!confirm('Are you sure you want to delete this employee? This action is permanent.')) return

    try {
      await this.manpowerService.deleteRow(this.code(), d.index, 'BILLING-TEMPLATE.xlsm', 'EmployeeTable')
      toast.success('Employee deleted successfully')
      await this.loadData()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete employee'
      toast.error(errorMessage)
    }
  }

  totalPages() { return Math.ceil(this.filteredManpower().length / this.pageSize()) }

  gotoPage(page: number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }

  generate() {
    this.router.navigate(['manpower', this.code(), 'add'])
  }
}
