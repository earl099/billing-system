import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MATERIAL_MODULES } from '@material';

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
    DecimalPipe
  ],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Create implements OnInit {
  formConfig = signal<FieldConfig[]>([])

  private employeeSchema: Record<string, FieldConfig[]> = {
    ofbank: [
      { key: 'empNo', label: 'Employee No', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'posCode', label: 'Position Code', type: 'text', required: true },
      { key: 'dept', label: 'Department', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'text', required: true },
      { key: 'payType', label: 'Pay type', type: 'text', required: true },
      { key: 'payFreq', label: 'Pay Frequency', type: 'text', required: true },
      { key: 'tin', label: 'TIN', type: 'text', required: true },
      { key: 'sssNo', label: 'SSS No.', type: 'text', required: true },
      { key: 'phicNo', label: 'PHIC No.', type: 'text', required: true },
      { key: 'hdmfNo', label: 'HDMF No.', type: 'text', required: true },
      { key: 'hd', label: 'HD', type: 'text', required: true },
      { key: 'mfopt', label: 'MFOPT Amount', type: 'number', required: true },
      { key: 'salary', label: 'Salary', type: 'number', required: true },
      { key: 'bankNo', label: 'Bank Account No.',  type: 'number', required: true},
      { key: '', label: 'Endorsed', type: 'number', required: true }
    ]
  }

  async ngOnInit() {

  }
}
