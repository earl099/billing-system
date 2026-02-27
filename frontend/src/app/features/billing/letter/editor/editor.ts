import { DecimalPipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { FileEditor } from '@services/file-editor';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MonthYearPickerComponent } from './datepickers/month-year-picker';
import { MonthDateYearPickerComponent } from './datepickers/month-date-year-picker';
import { DateMonthYearPickerComponent } from './datepickers/date-month-year-picker';
import { MonthPickerComponent } from './datepickers/month-picker';
import { YearPickerComponent } from './datepickers/year-picker';

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
      { key: 'addressee', label: 'Addressed To (Introduction)', type: 'text', required: true, colSpan: 2 },
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
    ]
  }

  fileEditorService = inject(FileEditor)
  sanitizer = inject(DomSanitizer)
  router = inject(Router)
  route = inject(ActivatedRoute)
  fb = inject(UntypedFormBuilder)

  readonly code = signal(this.route.snapshot.paramMap.get('code'))

  form: UntypedFormGroup = this.fb.group({})
  transmittalItems: UntypedFormArray = this.fb.array([])

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

  safeUrl = computed<SafeResourceUrl | null>(() =>
    this._url()
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this._url()!)
      : null
  )

  async ngOnInit() {
    this.loadTemplates()
  }

  async loadTemplates() {
    const code = this.route.snapshot.paramMap.get('code')!
    const templateList = await this.fileEditorService.getTemplates(code)
    this.templates.set(templateList)
  }

  selectTemplate(t: any) {
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

    const currentCode = this.code()!
    const schema = this.billingSchemas[currentCode]

    if(schema && this.fileType() !== 'excel') {
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
    try {
      this.isGenerating.set(true)
      const doc = await this.fileEditorService.createBillingDocument(this.selectedTemplate().id, this.code()!, {}, true, this.fileType()!)

      window.open(doc.editUrl, '_blank')
    } finally {
      this.isGenerating.set(false)
      this.router.navigate([
        'billing',
        this.route.snapshot.paramMap.get('code')!.toLowerCase(),
        'generate'
      ])
    }
  }

  async createBillingLetter() {
    if(this.form.invalid) return

    try {
      this.isGenerating.set(true)

      const formValue = this.transformFormValues(this.fileType()!)

      const bLetter = await this.fileEditorService.createBillingDocument(
        this.selectedTemplate().id,
        this.code()!,
        formValue,
        false,
        this.fileType()!
      )

      window.open(bLetter.editUrl, '_blank')
    } finally {
      this.isGenerating.set(false)

      this.router.navigate([
        'billing',
        this.route.snapshot.paramMap.get('code')!.toLowerCase(),
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

      if(field.type === 'date' && field.dateFormat && values[field.key]) {
        values[field.key] = formatDate(values[field.key], field.dateFormat, 'en-US')
      }

      if(field.type === 'number' && values[field.key] != null) {
        values[field.key] = Number(values[field.key]).toFixed(2)
      }

      if (field.type === 'monthYear' && field.dateFormat && values[field.key]) {
        values[field.key] = values[field.key].toFormat(field.dateFormat)
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

  removeTransmittalRow() { this.transmittalItems.removeAt(this.transmittalItems.length - 1) }

  get transmittalControls() {
    return this.transmittalItems.controls as UntypedFormGroup[]
  }

  get transmittalTotal(): number {
    return this.transmittalItems.controls
    .map(ctrl => Number(ctrl.get('amount')?.value || 0))
    .reduce((a,b) => a + b, 0)
  }
}
