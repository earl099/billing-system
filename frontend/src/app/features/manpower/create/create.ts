import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';
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
    ]
  }

  inputColumnMap: Record<string, string[]> = {
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
    ]
  }

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
    ]
  }

  route = inject(ActivatedRoute)
  router = inject(Router)
  fb = inject(UntypedFormBuilder)

  readonly code = signal(this.route.snapshot.paramMap.get('code'))

  form: UntypedFormGroup = this.fb.group({})

  async ngOnInit() {
    this.formConfig.set(this.employeeSchema[this.code()!])
    this.buildDynamicForm(this.employeeSchema[this.code()!])
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

  decimalFilter(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    let input = event.target.value + String.fromCharCode(event.charCode);

    if (!reg.test(input)) {
        event.preventDefault();
    }
  }

  async addData() {
    try {
      await this.manpowerService.addToTable(
        this.code() ?? '',
        'BILLING-TEMPLATE.xlsm',
        'EmployeeTable',
        {
          form: this.form.value,
          columnMap: this.fullColumnMap[this.code()!]
        }
      )
      toast.success('Added Employee Successfully!')
      this.router.navigate(['manpower', this.code()!, 'list'])
    } catch (error) {
      console.log(error)
    }

  }

  backToList() {
    this.router.navigate(['manpower', this.code(), 'list'])
  }
}
