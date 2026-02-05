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
export class List implements OnInit {
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

  columns = ['payType', 'delete']

  filteredPayFreqs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.payFreqs();

    return this.payFreqs().filter(p =>
      p.payType.toLowerCase().includes(q)
    )
  })

  paginatedPayFreqs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredPayFreqs().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    await this.load()
  }

  async load() {
    const payFreqList = await this.payFreqService.list()
    this.payFreqs.set(payFreqList)
    const clientList = await this.clientService.list()
    this.clients.set(clientList)
  }

  isUsed(p: any): boolean {
    for (let i = 0; i < this.clients().length; i++) {
      if(p._id === this.clients()[i].payFreq[0]) {
        return true
      }
    }
    return false
  }

  async deletePayFreq(p: any) {
    for (let j = 0; j < this.clients().length; j++) {
      if(p._id === this.clients()[j].payFreq[0]) {
        toast.error('This Pay Frequency is used by a Client.')
        return
      }
    }

    if(!confirm('Are you sure you want to delete this Pay Frequency? This action is permanent.')) return;
    await this.payFreqService.delete(p._id)
    toast.success('Pay Frequency deleted successfully')
    await this.load()

    const log: LogDTO = {
      user: this.authService.fetchUser() ?? '',
      operation: 'Deleted Pay Frequency'
    }

    await this.logService.create(log)
  }

  totalPages() {
    return Math.ceil(this.filteredPayFreqs().length / this.pageSize())
  }

  gotoPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()))
  }
}
