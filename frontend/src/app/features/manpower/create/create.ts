/**
 * @fileoverview Manpower employee creation component
 * Dynamically builds a form based on the actual columns of the EmployeeTable
 * in the selected template, excluding formula-derived columns.
 */

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

  readonly code = signal(this.route.snapshot.paramMap.get('code'))

  templates = signal<any[]>([])
  selectedTemplate = signal<any>(null)
  needsTemplateSelection = signal(false)
  fileName = signal<string | null>(this.route.snapshot.queryParamMap.get('fileName'))
  loading = signal(false)
  columnsLoading = signal(false)

  tableColumns = signal<string[]>([])
  formulaColumns = signal<string[]>([])

  form: UntypedFormGroup = this.fb.group({})

  /** Fallback client-specific form field schemas */
  private employeeSchema: Record<string, FieldConfig[]> = {
    ofbank: [
      { key: 'empNo', label: 'Employee No', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'posCode', label: 'Position Code', type: 'text', required: true },
      { key: 'dept', label: 'Department', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'payType', label: 'Pay type', type: 'text' },
      { key: 'payFreq', label: 'Pay Frequency', type: 'text' },
      { key: 'tin', label: 'TIN', type: 'text' },
      { key: 'sssNo', label: 'SSS No.', type: 'text' },
      { key: 'phicNo', label: 'PHIC No.', type: 'text' },
      { key: 'hdmfNo', label: 'HDMF No.', type: 'text' },
      { key: 'hd', label: 'HD', type: 'text' },
      { key: 'mfopt', label: 'MFOPT Amount', type: 'text'},
      { key: 'salary', label: 'Salary', type: 'text' },
      { key: 'bankNo', label: 'Bank Account No.',  type: 'text' },
    ],
    btr: [
      { key: 'empNo', label: 'Employee No', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'posCode', label: 'Position Code', type: 'text', required: true },
      { key: 'dept', label: 'Department', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'payType', label: 'Pay type', type: 'text' },
      { key: 'payFreq', label: 'Pay Frequency', type: 'text' },
      { key: 'tin', label: 'TIN', type: 'text' },
      { key: 'sssNo', label: 'SSS No.', type: 'text' },
      { key: 'phicNo', label: 'PHIC No.', type: 'text' },
      { key: 'hdmfNo', label: 'HDMF No.', type: 'text' },
      { key: 'hd', label: 'HD', type: 'text' },
      { key: 'mfopt', label: 'MFOPT Amount', type: 'text' },
      { key: 'salary', label: 'Salary', type: 'text' },
      { key: 'bankNo', label: 'Bank Account No.', type: 'text' },
    ],
  }

  /** Fallback full column map including formula-derived columns */
  private fullColumnMap: Record<string, string[]> = {
    ofbank: [
      'empNo',
      'name',
      'posCode',
      'dept',
      'status',
      'type',
      'payType',
      'payFreq',
      'tin',
      'sssNo',
      'phicNo',
      'hdmfNo',
      'hd',
      'mfopt',
      'salary',
      'bankNo',
    ],
    btr: [
      'empNo',
      'name',
      'posCode',
      'dept',
      'status',
      'type',
      'payType',
      'payFreq',
      'tin',
      'sssNo',
      'phicNo',
      'hdmfNo',
      'hd',
      'mfopt',
      'salary',
      'bankNo',
    ],
  }

  /** Full column map including formula-derived columns in the Excel table */
  fullColumnMap: Record<string, string[]> = {
    ofbank: [
      'empNo',
      'name',
      'posCode',
      'posName',
      'dept',
      'status',
      'type',
      'payType',
      'payFreq',
      'tin',
      'sssNo',
      'phicNo',
      'hdmfNo',
      'hd',
      'mfopt',
      'salary',
      'bankNo',
      'endorsed',
      'difference',
      'dBillingRate',
      'mBillingRate'
    ],
    btr: [
      'empNo',
      'name',
      'posCode',
      'posName',
      'dept',
      'status',
      'type',
      'payType',
      'payFreq',
      'tin',
      'sssNo',
      'phicNo',
      'hdmfNo',
      'hd',
      'mfopt',
      'salary',
      'bankNo',
      'endorsed',
      'difference',
      'dBillingRate',
      'mBillingRate'
    ],
  }

  private buildDynamicForm(columns: string[], formulaSet: Set<string>) {
    const formulaLower = new Set(Array.from(formulaSet).map(c => c.toLowerCase().trim()))
    const inputCols = columns.filter(c => !formulaLower.has(c.toLowerCase().trim()))
    const fields: FieldConfig[] = inputCols.map(col => ({
      key: col,
      label: col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
      type: 'text',
      required: false
    }))

  readonly code = signal(this.route.snapshot.paramMap.get('code')?.toLowerCase() ?? '')

    this.formConfig.set(fields)

    const group: any = {}
    for (const field of fields) {
      group[field.key] = ['', field.required ? Validators.required : []]
    }
    this.form = this.fb.group(group)
  }

  private buildFallbackForm(code: string) {
    const schema = this.employeeSchema[code]
    if (!schema) {
      toast.error('Unsupported client')
      return
    }
    this.formConfig.set(schema)
    const group: any = {}
    for (const field of schema) {
      group[field.key] = ['', field.required ? Validators.required : []]
    }
    this.form = this.fb.group(group)
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
        this.selectedTemplate.set(match ?? { name: passedFileName })
        await this.loadColumns()
      } else if (excelTemplates.length === 1) {
        this.selectedTemplate.set(excelTemplates[0])
        this.fileName.set(excelTemplates[0].name)
        await this.loadColumns()
      } else if (excelTemplates.length > 1) {
        this.needsTemplateSelection.set(true)
      } else {
        // No templates: fall back to hardcoded schema
        this.buildFallbackForm(code)
      }
    } catch (e) {
      toast.error('Failed to load templates')
      this.buildFallbackForm(code)
    } finally {
      this.loading.set(false)
    }
  }

  async onTemplateSelected(template: any) {
    this.selectedTemplate.set(template)
    this.fileName.set(template?.name ?? null)
    this.needsTemplateSelection.set(false)
    await this.loadColumns()
  }

  async loadColumns() {
    const code = this.code()
    const templateName = this.selectedTemplate()?.name ?? this.fileName()
    if (!code || !templateName) {
      this.buildFallbackForm(code!)
      return
    }

    this.columnsLoading.set(true)
    try {
      const { columns, formulaColumns } = await this.manpowerService.getColumns(code, templateName, 'EmployeeTable')
      if (columns && columns.length > 0) {
        this.tableColumns.set(columns)
        let formulaSet = new Set((formulaColumns ?? []).map(c => c.toLowerCase().trim()))
        let inputCols = columns.filter(c => !formulaSet.has(c.toLowerCase().trim()))

        // If detection didn't filter anything, fall back to index-based detection
        // using the canonical column order and known formula columns.
        if (inputCols.length === columns.length && columns.length > 0) {
          const canonical = this.fullColumnMap[code] ?? []
          if (canonical.length === columns.length) {
            const formulaCodeNames = new Set(['posname', 'dept', 'semimonthlyrate', 'endorsed', 'difference', 'dbillingrate', 'mbillingrate'])
            const formulaIndices = canonical
              .map((name, idx) => (formulaCodeNames.has(name.toLowerCase()) ? idx : -1))
              .filter(i => i >= 0)
            const formulaHeaders = new Set(formulaIndices.map(i => columns[i].toLowerCase().trim()))
            if (formulaHeaders.size > 0) {
              formulaSet = formulaHeaders
              inputCols = columns.filter(c => !formulaSet.has(c.toLowerCase().trim()))
            }
          }
        }

        // Last-resort: only keep known input columns if still nothing filtered
        if (inputCols.length === columns.length && columns.length > 0) {
          const knownInputHints = new Set([
            'empno', 'employee no', 'employeeno', 'employee number',
            'name', 'employee name',
            'poscode', 'position code', 'positioncode',
            'dept', 'department',
            'status',
            'type',
            'paytype', 'pay type',
            'payfreq', 'pay frequency', 'payfrequency',
            'tin',
            'sssno', 'sss no', 'sss number',
            'phicno', 'phic no', 'phic number',
            'hdmfno', 'hdmf no', 'hdmf number',
            'hd',
            'mfopt', 'mfopt amount', 'mfoptamount',
            'salary',
            'bankno', 'bank account no', 'bank account number'
          ].map(h => h.replace(/[.\s]+$/g, '').replace(/\s+/g, ' ')))
          const normalize = (s: string) => s.toLowerCase().trim().replace(/[.\s]+$/g, '').replace(/\s+/g, ' ')
          const knownFiltered = columns.filter(c => knownInputHints.has(normalize(c)))
          if (knownFiltered.length > 0 && knownFiltered.length < columns.length) {
            formulaSet = new Set(columns.filter(c => !knownFiltered.includes(c)).map(c => c.toLowerCase().trim()))
            inputCols = knownFiltered
          }
        }

        this.formulaColumns.set(Array.from(formulaSet))
        this.buildDynamicForm(columns, formulaSet)
      } else {
        this.buildFallbackForm(code)
      }
    } catch (e) {
      // Fall back to hardcoded schema
      this.buildFallbackForm(code)
    } finally {
      this.columnsLoading.set(false)
    }
  }

  decimalFilter(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    let input = event.target.value + String.fromCharCode(event.charCode);
    if (!reg.test(input)) {
      event.preventDefault();
    }
  }

  async addData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    try {
      await this.manpowerService.addToTable(
        code,
        templateName,
        'EmployeeTable',
        {
          form: this.form.value,
          columnMap
        }
      )
      toast.success('Added Employee Successfully!')
      this.router.navigate(['manpower', code, 'list'])
    } catch (error) {
      console.log(error)
    }
  }

  backToList() {
    this.router.navigate(['manpower', this.code(), 'list'])
  }
}