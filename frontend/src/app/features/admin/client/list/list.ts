import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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
export class List implements OnInit {
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  clients = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)

  private debounceTimer: any
  columns = ['code', 'name', 'actions']

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

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.clients();

    return this.clients().filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    )
  })

  paginatedClients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredClients().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  async load() {
    const clientList = await this.clientService.list()
    this.clients.set(clientList)
  }

  view(c: any) { this.router.navigate(['/admin/client', c._id]) }
  edit(c: any) { this.router.navigate(['/admin/client', c._id, 'edit']) }

  async delete(c: any) {
    if(!confirm('Are you sure you want to delete this Client? This action is permanent.')) return;
    await this.clientService.delete(c._id)
    toast.success('Client deleted successfully')
    await this.load()

    const log: LogDTO = {
      user: this.authService.fetchUser() ?? '',
      operation: 'Deleted Client'
    }

    await this.logService.create(log)
  }

  totalPages() { return Math.ceil(this.filteredClients().length / this.pageSize()) }

  gotoPage(page:number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }
}
