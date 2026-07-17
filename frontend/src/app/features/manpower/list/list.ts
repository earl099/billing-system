/**
 * @fileoverview Manpower employee list component
 * Displays a paginated, searchable table of employees from the SharePoint EmployeeTable
 * with view, edit, and delete actions. Loads available billing templates and requires
 * user selection when multiple templates exist.
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';
import { FileEditor } from '@services/file-editor';
import { toast } from 'ngx-sonner';
import { MatSelectModule } from '@angular/material/select';

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
  fileEditor = inject(FileEditor)
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

  /** Computed filtered employee list based on search query across multiple fields */
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

  /** Computed paginated subset of filtered employees */
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

  /** Fetches employee data from SharePoint and maps row values to display columns */
  async loadData() {
    try {
      this.loading.set(true)
      const fileName = this.selectedTemplate()?.name ?? ''
      const dataSource = await this.manpowerService.listData(this.code(), fileName, 'EmployeeTable')

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

  /** Navigates to the employee detail view, passing the selected template filename */
  view(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['manpower', this.code(), d.index, 'view'], {
      queryParams: { fileName: this.selectedTemplate()?.name ?? '' }
    })
  }

  /** Navigates to the employee edit form, passing the selected template filename */
  edit(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    this.router.navigate(['manpower', this.code(), d.index, 'edit'], {
      queryParams: { fileName: this.selectedTemplate()?.name ?? '' }
    })
  }

  /** Deletes an employee row from the SharePoint EmployeeTable with confirmation */
  async delete(d: any) {
    if (!d?.index && d?.index !== 0) {
      toast.error('Invalid record')
      return
    }
    if(!confirm('Are you sure you want to delete this employee? This action is permanent.')) return

    try {
      const fileName = this.selectedTemplate()?.name ?? ''
      await this.manpowerService.deleteRow(this.code(), d.index, fileName, 'EmployeeTable')
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

  /** Navigates to the employee creation form */
  generate() {
    this.router.navigate(['manpower', this.code(), 'add'])
  }
}
