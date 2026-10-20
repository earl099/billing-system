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
import { toast } from 'ngx-sonner';

type FieldType = 'text' | 'number'
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

  tableColumns = signal<string[]>([])
  form: UntypedFormGroup = this.fb.group({})

  async ngOnInit() {
    const code = this.code()
    if (!code) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    this.loadTemplates()
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
    try {
      const { columns } = await this.manpowerService.getColumns(code, templateName, 'EmployeeTable')
      if (columns && columns.length > 0) {
        this.tableColumns.set(columns)
        this.buildForm(columns)
      } else {
        this.buildFallbackForm()
      }
    } catch (e) {
      this.buildFallbackForm()
    } finally {
      this.columnsLoading.set(false)
    }
  }

  private buildForm(columns: string[]) {
    const fields: FieldConfig[] = columns.map(col => ({
      key: col,
      label: col,
      type: 'text',
      required: ['empNo', 'name'].includes(col) || ['empno', 'name'].includes(col.toLowerCase())
    }))

    this.formConfig.set(fields)
    const group: any = {}
    for (const field of fields) {
      group[field.key] = ['', field.required ? Validators.required : []]
    }
    this.form = this.fb.group(group)
  }

  private buildFallbackForm() {
    const fields: FieldConfig[] = [
      { key: 'empNo', label: 'Employee No', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'posCode', label: 'Position Code', type: 'text' },
      { key: 'dept', label: 'Department', type: 'text' },
    ]
    this.formConfig.set(fields)
    const group: any = {}
    for (const field of fields) {
      group[field.key] = ['', field.required ? Validators.required : []]
    }
    this.form = this.fb.group(group)
  }

  async addData() {
    const code = this.code()
    const templateName = this.selectedTemplate()?.name ?? this.fileName()

    if (!code || !templateName) {
      toast.error('No template selected')
      return
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    try {
      await this.manpowerService.addToTable(code, templateName, 'EmployeeTable', {
        form: this.form.value,
        columnMap: this.tableColumns().length > 0 ? this.tableColumns() : Object.keys(this.form.value)
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