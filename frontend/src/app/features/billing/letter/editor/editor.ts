import { DecimalPipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { FileEditor } from '@services/file-editor';
import { MonthYearPickerComponent } from './datepickers/month-year-picker';
import { MonthDateYearPickerComponent } from './datepickers/month-date-year-picker';
import { DateMonthYearPickerComponent } from './datepickers/date-month-year-picker';
import { MonthPickerComponent } from './datepickers/month-picker';
import { YearPickerComponent } from './datepickers/year-picker';
import { toast } from 'ngx-sonner';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'monthYear' | 'dateMonthYear' | 'month' | 'year'
interface FieldConfig {
  key: string
  label: string
  type: FieldType
  required?: boolean
  colSpan?: number
  dateFormat?: string
}


@Component({
  selector: 'app-editor',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MonthYearPickerComponent,
    MonthDateYearPickerComponent,
    DateMonthYearPickerComponent,
    MonthPickerComponent,
    YearPickerComponent,
    DecimalPipe
],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  providers: [provideLuxonDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements OnInit {
  templates = signal<any[]>([])
  selectedTemplate = signal<any>(null)
  isBlankSelected = signal(false)
  isGenerating = signal(false)
  _url = signal<string | null>(null)
  step = signal(1)
  formConfig = signal<FieldConfig[]>([])
  fileType = signal<'word' | 'excel' | null>(null)

  private billingSchemas: Record<string, FieldConfig[]> = {
    acid: [
      { key: 'soaNo', label: 'SOA Number', type: 'text', required: true },
      { key: 'billingDate', label: 'Billing Date', type: 'dateMonthYear', required: true, dateFormat:'d MMMM yyyy' },
      { key: 'addressedTo', label: 'Addressed To', type: 'textarea', required: true, colSpan: 2 },
      { key: 'addressee', label: 'Recipient', type: 'text', required: true, colSpan: 2 },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'particulars', label: 'Particulars', type: 'text', required: true },
      { key: 'client', label: 'Project Name', type: 'text', required: true },
      { key: 'clientAddress', label: 'Location', type: 'text', required: true },
      { key: 'appraisalAmt', label: 'Appraisal Amount', type: 'number', required: true },
      { key: 'totalAmt', label: 'Total Amount Due', type: 'number', required: true },
      { key: 'bcuChiefName', label: 'COD, Billing & Collection Unit', type: 'text', required: true },
      { key: 'acidOicName', label: 'OIC, ACID', type: 'text', required: true },
    ],

    jss: [
      { key: 'soaNo', label: 'SOA Number', type: 'text', required: true },
      { key: 'billingDate', label: 'Billing Date', type: 'date', required: true, dateFormat:'MMMM dd, yyyy' },
      { key: 'monthAndYear', label: 'Month and Year', type: 'monthYear', required: true, dateFormat: 'MMMM yyyy' },
      { key: 'amt', label: 'Amount', type: 'number', required: true },
      { key: 'bAsstName', label: 'Billing Assistant', type: 'text', required: true },
      { key: 'bcuChiefName', label: 'Chief of Division, Billing & Collection Unit', type: 'text', required: true },
    ],
    spad: [
      { key: 'billingYear', label: 'Billing Year', type: 'year', required: true, dateFormat: 'yyyy' },
      { key: 'billingMonth', label: 'Billing Month', type: 'month', required: true, dateFormat: 'MMMM' },
      { key: 'billingDate', label: 'Billing Date', type: 'date', required: true, dateFormat: 'MMMM dd, yyyy' },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'monthAndYear', label: 'Month and Year', type: 'monthYear', required: true, dateFormat: 'MMMM yyyy' },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'pmcNo', label: 'PMC Number', type: 'text', required: true },
      { key: 'bAsstName', label: 'Billing Assistant', type: 'text', required: true },
      { key: 'bcuChiefName', label: 'Billing & Collection Chief of Division', type: 'text', required: true },
    ],
    ofbank: [
      { key: 'soaNo', label: 'SOA Number', type: 'text', required: true },
      { key: 'billingDate', label: 'Billing Date', type: 'date', required: true, dateFormat:'MMMM dd, yyyy' },
      { key: 'addressedTo', label: 'Addressed to', type: 'textarea', required: true },
      { key: 'recipient', label: 'Recipient', type: 'text', required: true },
      { key: 'particulars', label: 'Particulars', type: 'text', required: true },
      { key: 'billingPeriod', label: 'Billing Period', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'peso', label: 'Peso', type: 'text', required: true },
      { key: 'cent', label: 'Cent', type: 'text', required: true },
      { key: 'bcuChiefName', label: 'Billing & Collection Chief of Division', type: 'text', required: true },
    ]
  }

  private trustedDomains = ['lbpresources.sharepoint.com', 'cloudinary.com']

  fileEditorService = inject(FileEditor)
  sanitizer = inject(DomSanitizer)
  router = inject(Router)
  route = inject(ActivatedRoute)
  fb = inject(UntypedFormBuilder)

  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? '')

  form: UntypedFormGroup = this.fb.group({})
  form1: UntypedFormGroup = this.fb.group({})
  transmittalItems: UntypedFormArray = this.fb.array([])

  private isUrlTrusted(url: string): boolean {
    try {
      const urlObj = new URL(url)
      if (urlObj.protocol !== 'https:') {
        return false
      }
      return this.trustedDomains.some(domain => urlObj.hostname === domain)
    } catch {
      return false
    }
  }

  private buildDynamicForm(schema: FieldConfig[]) {
    const group: any = {}

    for(const field of schema) {
      group[field.key] = [
        '',
        field.required ? Validators.required : []
      ]
    }

    this.form = this.fb.group(group)
  }

  safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this._url()
    if (!url || !this.isUrlTrusted(url)) {
      return null
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  })

  async ngOnInit() {
    if (!this.code()) {
      toast.error('Invalid client code')
      this.router.navigate(['/'])
      return
    }
    await this.loadTemplates()
  }

  async loadTemplates() {
    try {
      const code = this.code()
      if (!code) {
        toast.error('Invalid client code')
        return
      }
      const templateList = await this.fileEditorService.getTemplates(code)
      this.templates.set(templateList)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load templates'
      toast.error(errorMessage)
    }
  }

  selectTemplate(t: any) {
    if (!t || !t.name) {
      toast.error('Invalid template')
      return
    }

    this.selectedTemplate.set(t)

    if(t.name.toLowerCase().includes('.xlsx')) {
      this.fileType.set('excel')
    }
    else {
      this.fileType.set('word')
    }

    if(t.name.toLowerCase().includes('blank')) {
      this.isBlankSelected.set(true)
      this.step.set(1)
      this.formConfig.set([])
      this.form.reset()
      return
    }

    this.isBlankSelected.set(false)

    const currentCode = this.code()
    if (!currentCode) {
      toast.error('Invalid client code')
      return
    }

    const schema = this.billingSchemas[currentCode]
    if (!schema) {
      toast.error('No schema found for this client')
      return
    }

    if(this.fileType() !== 'excel') {
      this.formConfig.set(schema)
      this.buildDynamicForm(schema)
      this.step.set(2)
    }
    else {
      this.formConfig.set(schema)
      this.buildDynamicForm(schema)

      this.transmittalItems.clear()
      this.form.addControl('transmittalItems', this.transmittalItems)
      this.createTransmittalRow()
      this.step.set(3)
    }
  }

  async createBlank() {
    if (!this.selectedTemplate()) {
      toast.error('Please select a template')
      return
    }

    try {
      this.isGenerating.set(true)
      const code = this.code()
      if (!code) {
        toast.error('Invalid client code')
        return
      }

      const doc = await this.fileEditorService.createBillingDocument(
        this.selectedTemplate().id,
        code,
        {},
        true,
        this.fileType()!
      )

      window.open(doc.editUrl, '_blank')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create document'
      toast.error(errorMessage)
    } finally {
      this.isGenerating.set(false)
      this.router.navigate([
        'billing',
        this.code().toLowerCase(),
        'generate'
      ])
    }
  }

  async createBillingLetter() {
    if(this.form.invalid) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      this.isGenerating.set(true)

      const formValue = this.transformFormValues(this.fileType()!)
      const code = this.code()
      if (!code) {
        toast.error('Invalid client code')
        return
      }

      const bLetter = await this.fileEditorService.createBillingDocument(
        this.selectedTemplate().id,
        code,
        formValue,
        false,
        this.fileType()!
      )

      window.open(bLetter.editUrl, '_blank')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create billing letter'
      toast.error(errorMessage)
    } finally {
      this.isGenerating.set(false)

      this.router.navigate([
        'billing',
        this.code().toLowerCase(),
        'generate'
      ])
    }
  }

  decimalFilter(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    let input = event.target.value + String.fromCharCode(event.charCode);

    if (!reg.test(input)) {
        event.preventDefault();
    }
  }

  private transformFormValues(type: 'word' | 'excel') {
    const values = { ...this.form.value }
    const schema = this.formConfig()

    for(const field of schema) {
      switch(field.type) {
        case 'date':
        case 'dateMonthYear':
        case 'monthYear':
          if(field.dateFormat && values[field.key]) {
            if(field.type === 'date') {
              values[field.key] = formatDate(values[field.key], field.dateFormat, 'en-US')
            }
            else {
              values[field.key] = values[field.key].toFormat(field.dateFormat)
            }
          }
          break
        case 'number':
          if(values[field.key] != null) {
            values[field.key] = Number(values[field.key]).toFixed(2)
          }
          break
      }

      if(type === 'excel') {
        if(field.type === 'date' && values[field.key]) {
          values[field.key] = new Date(values[field.key]).toISOString()
        }
        else if(field.type === 'monthYear' && values[field.key]) {
          values[field.key] = new Date(values[field.key]).toISOString()
        }
      }
    }

    return values
  }

  createTransmittalRow() {
    const group: any = {}
    const transmittalFieldConfig: FieldConfig[] = [
      { key: 'property', label: 'Property', type: 'text', required: true },
      { key: 'monthYear', label: 'Month and Year', type: 'monthYear', required: true, dateFormat: 'MMMM yyyy' },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'pmcNo', label: 'PMC Number', type: 'text', required: true },
    ]

    for(const field of transmittalFieldConfig) {
      group[field.key] = [
        '',
        field.required ? Validators.required : []
      ]
    }

    this.transmittalItems.push(this.fb.group(group))
  }

  removeTransmittalRow() {
    if (this.transmittalItems.length > 0) {
      this.transmittalItems.removeAt(this.transmittalItems.length - 1)
    }
  }

  get transmittalControls() {
    return this.transmittalItems.controls as UntypedFormGroup[]
  }

  get transmittalTotal(): number {
    return this.transmittalItems.controls
    .map(ctrl => Number(ctrl.get('amount')?.value || 0))
    .reduce((a,b) => a + b, 0)
  }
}
