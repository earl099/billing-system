import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';
import { FileEditor } from '@services/file-editor';
import { Rates } from '@services/rates';
import { BillingRate } from '@models/billing-rate';
import { toast } from 'ngx-sonner';

type FieldType = 'text' | 'number' | 'select'
interface FieldConfig {
  key: string
  label: string
  type: FieldType
  required?: boolean
  colSpan?: number
}

@Component({
  selector: 'app-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Create implements OnInit {
  formConfig = signal<FieldConfig[]>([])
  manpowerService = inject(Manpower)
  fileEditor = inject(FileEditor)
  ratesService = inject(Rates)

  route = inject(ActivatedRoute)
  router = inject(Router)
  fb = inject(UntypedFormBuilder)

  readonly code = signal(this.route.snapshot.paramMap.get('code')?.toLowerCase() ?? '')

  templates = signal<any[]>([])
  selectedTemplate = signal<any>(null)
  fileName = signal<string | null>(this.route.snapshot.queryParamMap.get('fileName'))
  loading = signal(false)
  columnsLoading = signal(false)
  needsTemplateSelection = signal(false)
  columnsError = signal<string | null>(null)
  positions = signal<BillingRate[]>([])
  positionsLoading = signal(false)
  positionsError = signal<string | null>(null)

  tableColumns = signal<string[]>([])
  form: UntypedFormGroup = this.fb.group({})

  async ngOnInit() {
    const code = this.code()
    if (!code) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.loadTemplates()
  }

  async loadTemplates() {
    const code = this.code()
    if (!code) return

    this.loading.set(true)
    try {
      const all = await this.fileEditor.getTemplates(code)
      const excelTemplates = all.filter((t: any) => t.type === 'excel' && t.name.endsWith('.xlsm'))
      this.templates.set(excelTemplates)

      const passedFileName = this.fileName()
      if (passedFileName) {
        const match = excelTemplates.find((t: any) => t.name === passedFileName)
        if (match) {
          this.selectedTemplate.set(match)
          this.fileName.set(match.name)
          await this.loadColumns()
        } else {
          this.needsTemplateSelection.set(true)
        }
      } else if (excelTemplates.length === 1) {
        this.selectedTemplate.set(excelTemplates[0])
        this.fileName.set(excelTemplates[0].name)
        await this.loadColumns()
      } else if (excelTemplates.length > 1) {
        this.needsTemplateSelection.set(true)
      }
    } catch (e) {
      toast.error('Failed to load templates')
    } finally {
      this.loading.set(false)
    }
  }

  onTemplateSelected(template: any) {
    this.selectedTemplate.set(template)
    this.fileName.set(template?.name ?? null)
    this.needsTemplateSelection.set(false)
    void this.loadColumns()
  }

  async loadColumns() {
    const code = this.code()
    const templateName = this.selectedTemplate()?.name ?? this.fileName()
    if (!code || !templateName) return

    this.columnsLoading.set(true)
    this.columnsError.set(null)
    const positionsRequest = this.loadPositions(code, templateName)
    try {
      const { columns, formulaColumns } = await this.manpowerService.getColumns(code, templateName, 'EmployeeTable')
      if (columns && columns.length > 0) {
        this.tableColumns.set(columns)
        const formulaColumnNames = new Set(formulaColumns.map((column) => column.trim().toLowerCase()))
        this.buildForm(columns.filter((column) =>
          !formulaColumnNames.has(column.trim().toLowerCase()) ||
          (code === 'dof' && column.trim().toLowerCase() === 'name')
        ))
      } else {
        throw new Error('No employee table columns were found.')
      }
    } catch (error) {
      this.tableColumns.set([])
      this.formConfig.set([])
      this.form = this.fb.group({})
      const message = error instanceof Error ? error.message : 'Failed to load employee table columns'
      this.columnsError.set(message)
      toast.error(message)
    } finally {
      await positionsRequest
      this.columnsLoading.set(false)
    }
  }

  private buildForm(columns: string[]) {
    const fields: FieldConfig[] = columns.map((col) => {
      const normalized = col.toLowerCase().replace(/[^a-z0-9]/g, '')
      const isPositionCode = ['poscode', 'positioncode'].includes(normalized)
      return {
        key: col,
        label: col,
        type: isPositionCode ? 'select' : 'text',
        required: isPositionCode || ['empno', 'employeeno', 'employeenumber', 'name', 'employeename'].includes(normalized)
      }
    })

    this.formConfig.set(fields)
    const group: any = {}
    for (const field of fields) {
      group[field.key] = ['', field.required ? Validators.required : []]
    }
    this.form = this.fb.group(group)
  }

  private async loadPositions(code: string, templateName: string): Promise<void> {
    this.positionsLoading.set(true)
    this.positionsError.set(null)
    this.positions.set([])

    try {
      const rates = await this.ratesService.list(code, templateName)
      const uniquePositions = new Map<string, BillingRate>()
      for (const rate of rates) {
        const posCode = String(rate.posCode ?? '').trim()
        if (posCode && !uniquePositions.has(posCode)) {
          uniquePositions.set(posCode, { ...rate, posCode })
        }
      }

      this.positions.set([...uniquePositions.values()])
      if (uniquePositions.size === 0) {
        throw new Error('No position codes are available in this template’s PositionTable.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load position codes'
      this.positionsError.set(message)
      toast.error(message)
    } finally {
      this.positionsLoading.set(false)
    }
  }

  async addData() {
    const code = this.code()
    const templateName = this.selectedTemplate()?.name ?? this.fileName()

    if (!code || !templateName) {
      toast.error('No template selected')
      return
    }

    if (this.tableColumns().length === 0 || this.formConfig().length === 0) {
      toast.error('Employee table columns are unavailable')
      return
    }

    const hasPositionCode = this.formConfig().some((field) => field.type === 'select')
    if (hasPositionCode && (this.positionsLoading() || this.positionsError() || this.positions().length === 0)) {
      toast.error(this.positionsError() ?? 'Position codes are unavailable')
      return
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    try {
      await this.manpowerService.addToTable(code, templateName, 'EmployeeTable', {
        form: this.form.value,
        columnMap: this.tableColumns()
      })
      toast.success('Added Employee Successfully!')
      this.router.navigate(['manpower', code, 'list'])
    } catch (error) {
      console.log(error)
      toast.error('Failed to add employee')
    }
  }

  backToList() {
    this.router.navigate(['manpower', this.code(), 'list'])
  }
}