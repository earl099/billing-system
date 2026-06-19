import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MATERIAL_MODULES } from '@material';

export interface BillingColumnDef {
  key: string
  label: string
  type: 'readonly' | 'time' | 'text' | 'hidden'
  index: number
}

export interface BillingRow {
  index: number
  values: any[]
}

@Component({
  selector: 'app-editable-billing-table',
  imports: [
    ...MATERIAL_MODULES,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './editable-table.html',
  styleUrl: './editable-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableBillingTable {
  title = input.required<string>()
  columnDefs = input.required<BillingColumnDef[]>()
  rawData = input.required<BillingRow[]>()

  formArray = new FormArray<FormGroup>([])

  displayedColumns = signal<string[]>([])
  rows = signal<(BillingRow & { formGroup: FormGroup })[]>([])

  private timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

  constructor() {
    effect(() => {
      const data = this.rawData()
      const cols = this.columnDefs()
      this.displayedColumns.set(cols.filter(c => c.type !== 'hidden').map(c => c.key))
      this.buildForm(data, cols)
    })
  }

  private buildForm(data: BillingRow[], cols: BillingColumnDef[]) {
    const groups: FormGroup[] = []
    const enrichedRows: (BillingRow & { formGroup: FormGroup })[] = []

    for (const row of data) {
      const controls: Record<string, FormControl> = {}

      for (const col of cols) {
        if (col.type === 'readonly' || col.type === 'hidden') continue

        const value = row.values[col.index] ?? ''
        const validators: ValidatorFn[] = col.type === 'time' ? [this.timeValidator()] : []
        controls[col.key] = new FormControl(value, validators)
      }

      const fg = new FormGroup(controls)
      groups.push(fg)
      enrichedRows.push({ ...row, formGroup: fg })
    }

    this.formArray = new FormArray(groups)
    this.rows.set(enrichedRows)
  }

  private timeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value
      if (!val || val === '') return null
      if (!this.timeRegex.test(val)) {
        return { invalidTime: true }
      }
      return null
    }
  }

  getColDef(key: string): BillingColumnDef | undefined {
    return this.columnDefs().find(c => c.key === key)
  }

  getCellDisplay(row: BillingRow, col: BillingColumnDef): any {
    return row.values[col.index] ?? ''
  }

  getEditedRows(): BillingRow[] {
    const cols = this.columnDefs()
    const formulaIndices = cols
      .filter(c => c.type === 'readonly')
      .map(c => c.index)

    return this.rows().map((row, i) => {
      const fg = this.formArray.at(i)
      const values = row.values.map((val, colIdx) => {
        if (formulaIndices.includes(colIdx)) return null
        const col = cols.find(c => c.index === colIdx)
        if (!col || col.type === 'readonly' || col.type === 'hidden') return val
        return fg?.get(col.key)?.value ?? val
      })
      return { index: row.index, values }
    })
  }
}
