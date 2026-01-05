import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Log } from '@services/log';

@Component({
  selector: 'app-log-list',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './log-list.html',
  styleUrl: './log-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogList implements OnInit {
  logService = inject(Log)
  router = inject(Router)

  logs = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  private debounceTimer: any
  columns = ['user', 'operation', 'view']

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

  filteredLogs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.logs();

    return this.logs().filter(l =>
      l.operation.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q)
    )
  })

  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredLogs().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  async load() {
    const logList = await this.logService.list()
    this.logs.set(logList)
  }

  view(l: any) {
    this.router.navigate(['/admin/log', l._id])
  }

  totalPages() {
    return Math.ceil(this.filteredLogs().length / this.pageSize())
  }

  gotoPage(page: number) {
    this.currentPage.set(
      Math.min(Math.max(page, 1), this.totalPages())
    )
  }
}
