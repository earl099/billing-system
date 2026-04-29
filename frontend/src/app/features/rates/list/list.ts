import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';

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
export class List implements OnInit {
  manpowerService = inject(Manpower)
  route = inject(ActivatedRoute)
  router = inject(Router)

  readonly code = signal(this.route.snapshot.paramMap.get('code'))
  data = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)
  loading = signal(true)

  private debounceTimer: any
  displayedColumns = [
    'posCode',
    'posName',
    'actions'
  ]

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

  filteredBRate = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.data();

    return this.data().filter(d =>
      d.posCode.toLowerCase().includes(q) ||
      d.posName.toLowerCase()
    )
  })

  paginatedBRate = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredBRate().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.loadData()
  }

  async loadData() {
    const dataSource = await this.manpowerService.listData(this.code() ?? '', 'BILLING-TEMPLATE.xlsm', 'PositionTable')
    const formattedData = []

    for(let i = 0; i < dataSource.length; i++) {
      const obj = {}

      for(let j = 0; j < this.displayedColumns.length; j++) {
        let objData
        if(j === 0) {
          objData = Object.assign(obj, { index: dataSource[i][0].index })
        }
        else {
          objData = Object.assign(obj, { [this.displayedColumns[j-1]]: dataSource[i][0].values[j-1] })
        }
      }
      formattedData.push(obj)
    }
    this.data.set(formattedData)
    this.loading.set(false)
  }

  view(d: any) { this.router.navigate(['rates', this.code() ?? '', d.index, 'view']) }

  edit(d: any) { this.router.navigate(['rates', this.code() ?? '', d.index, 'edit']) }

  totalPages() { return Math.ceil(this.filteredBRate().length / this.pageSize()) }

  gotoPage(page: number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }

  generate() {
    this.router.navigate(['rates', this.code(), 'add'])
  }
}
