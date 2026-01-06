import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
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
  templateUrl: './payfreq-list.html',
  styleUrl: './payfreq-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayfreqList implements OnInit {
  payFreqService = inject(Payfreq)
  //TODO: MAKE THE PAY FREQUENCY UNDELETABLE WHEN IT IS CONNECTED TO A CLIENT
  //clientService = inject(Client)
  router = inject(Router)

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
  }

  async deletePayFreq(p: any) {
    //TODO: PUT A FUNCTION THAT CHECKS THE ID OF THE PAY FREQUENCY OF THE CLIENT THEN RETURNS THE FUNCTION
    if(!confirm('Are you sure you want to delete this Pay Frequency? This action is permanent.')) return;
    await this.payFreqService.delete(p._id)
    toast.success('Pay Frequency deleted successfully')
    await this.load()
  }

  totalPages() {
    return Math.ceil(this.filteredPayFreqs().length / this.pageSize())
  }

  gotoPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()))
  }
}
