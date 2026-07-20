/**
 * @fileoverview Billing rate list component
 * Displays a paginated, searchable table of billing rates from the SharePoint PositionTable
 * with view, edit, and delete actions. Logs delete operations for audit logging.
 * Requires template selection before loading PositionTable data when multiple templates exist.
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { FileEditor } from '@services/file-editor';
import { Log } from '@services/log';
import { Manpower } from '@services/manpower';
import { Rates } from '@services/rates';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-list',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule
  ],
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  manpowerService = inject(Manpower)
  ratesService = inject(Rates)
  fileEditor = inject(FileEditor)
  authService = inject(Auth)
  logService = inject(Log)
  route = inject(ActivatedRoute)
  router = inject(Router)

  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? '')
  data = signal<any[]>([])
  searchInput = signal('')
  searchQuery = signal('')
  currentPage = signal(1)
  pageSize = signal(5)
  loading = signal(false)

  templates = signal<any[]>([])
  selectedTemplate = signal<any>(null)
  needsTemplateSelection = signal(false)

  /** Debounce timer for search input to avoid excessive filtering */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  displayedColumns = [
    'posCode',
    'posName',
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

  /** Computed filtered billing rate list based on search query */
  filteredBRate = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    if(!q) return this.data();

    return this.data().filter(d =>
      d.posCode?.toLowerCase().includes(q) ||
      d.posName?.toLowerCase().includes(q)
    )
  })

  /** Computed paginated subset of filtered billing rates */
  paginatedBRate = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.filteredBRate().slice(start, start + this.pageSize())
  })

  async ngOnInit() {
    if (!this.code()) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.loadTemplates()
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  /** Loads available billing templates and decides whether to prompt or auto-load */
  async loadTemplates() {
    try {
      const all = await this.fileEditor.getTemplates(this.code())
      const excelTemplates = all.filter((t: any) =>
        t.type === 'excel' && t.name.endsWith('.xlsm')
      )
      this.templates.set(excelTemplates)

      if (excelTemplates.length > 1) {
        this.needsTemplateSelection.set(true)
      } else {
        if (excelTemplates.length === 1) {
          this.selectedTemplate.set(excelTemplates[0])
        }
        this.loading.set(true)
        await this.loadData()
      }
    } catch (e) {
      toast.error('Failed to load templates')
    }
  }

  /** Handles template selection and triggers data loading */
  async onTemplateSelected(template: any) {
    this.selectedTemplate.set(template)
    this.loading.set(true)
    await this.loadData()
  }

  /** Fetches billing rate data from SharePoint and maps row values to display columns */
  async loadData() {
    try {
      this.loading.set(true)
      const fileName = this.selectedTemplate()?.name ?? 'BILLING-TEMPLATE.xlsm'
      const dataSource = await this.manpowerService.listData(this.code(), fileName, 'PositionTable')
      const formattedData = []

      for(let i = 0; i < dataSource.length; i++) {
        const obj: any = { index: dataSource[i].index }

        for(let j = 0; j < this.displayedColumns.length - 1; j++) {
          obj[this.displayedColumns[j]] = dataSource[i].values[j] ?? ''
        }
        formattedData.push(obj)
      }
      this.data.set(formattedData)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load rates data'
      toast.error(errorMessage)
    } finally {
      this.loading.set(false)
    }
  }

  /** Navigates to the billing rate detail view */
  view(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['rates', this.code(), d.index, 'view'])
  }

  /** Navigates to the billing rate edit form */
  edit(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['rates', this.code(), d.index, 'edit'])
  }

  /** Deletes a billing rate from the SharePoint PositionTable with confirmation and audit logging */
  async deleteRate(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    if (!confirm('Are you sure you want to delete this billing rate?')) return
    try {
      await this.ratesService.delete(this.code(), d.index)
      toast.success('Billing rate deleted successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Deleted Billing Rate'
      }
      await this.logService.create(log)

      await this.loadData()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete billing rate')
    }
  }

  totalPages() { return Math.ceil(this.filteredBRate().length / this.pageSize()) }

  gotoPage(page: number) {
    if(this.totalPages() < 1) { this.currentPage.set(0) }
    else { this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages())) }
  }

  /** Navigates to the billing rate creation form, passing the selected template filename */
  generate() {
    this.router.navigate(['rates', this.code(), 'add'], {
      queryParams: { fileName: this.selectedTemplate()?.name ?? '' }
    })
  }
}
