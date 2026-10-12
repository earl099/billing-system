import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Log } from '@services/log';

@Component({
  selector: 'app-log-list',
  imports: [...MATERIAL_MODULES, MatTableModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  private readonly logService = inject(Log)
  readonly router = inject(Router)
  readonly logs = signal<any[]>([])
  readonly loading = signal(true)
  readonly loadError = signal<string | null>(null)
  readonly searchInput = signal('')
  readonly searchQuery = signal('')
  readonly currentPage = signal(1)
  readonly pageSize = signal(10)
  readonly columns = ['user', 'operation', 'date', 'actions']
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

  readonly filteredLogs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase()
    if (!query) return this.logs()
    return this.logs().filter((log) =>
      String(log?.operation ?? '').toLowerCase().includes(query) ||
      String(log?.user ?? '').toLowerCase().includes(query)
    )
  })

  readonly paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredLogs().slice(start, start + this.pageSize())
  })

  async ngOnInit(): Promise<void> { await this.load() }

  ngOnDestroy(): void { if (this.debounceTimer) clearTimeout(this.debounceTimer) }

  async load(): Promise<void> {
    this.loading.set(true)
    this.loadError.set(null)
    try {
      const logList = await this.logService.list()
      this.logs.set(Array.isArray(logList) ? logList : [])
    } catch {
      this.logs.set([])
      this.loadError.set('We could not load the audit history. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }

  view(log: any): void { if (log?._id) this.router.navigate(['/admin/log', log._id]) }

  totalPages(): number { return Math.ceil(this.filteredLogs().length / this.pageSize()) }

  gotoPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), Math.max(this.totalPages(), 1)))
  }

  formatDate(value: unknown): string {
    if (!value) return 'Not recorded'
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString()
  }
}
