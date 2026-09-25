import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatStepperModule } from '@angular/material/stepper'
import { MatTabsModule } from '@angular/material/tabs'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { Router, RouterLink } from '@angular/router'
import { BillingRow } from '@billing/ofbank/editable-table/editable-table'
import { DofBilling, DofBillingTableRow, DofTableRow, DofTimekeepingFiles } from '@services/dof-billing'
import { DateTime } from 'luxon'
import { toast } from 'ngx-sonner'

interface AbsenceEntry {
  date: string
}

interface UndertimeEntry {
  date: string
  time: string
}

interface OvertimeEntry {
  type: string
  date: string
  time: string
}

interface NightDifferentialEntry {
  type: string
  date: string
  time: string
}

interface JanitorialDayEntry {
  date: string
  checked: boolean
  hours: string
}

type GridTimeField = 'undertime' | 'overtime' | 'nightDifferential' | 'renderedHours'

interface GridColumn {
  key: string
  label: string
  kind?: GridTimeField
  entryType?: string
}

interface GridRow {
  dateIso: string
  dayName: string
  dayShort: string
  isRestDay: boolean
  isAbsent: boolean
  isFullDay: boolean
  isInPeriod: boolean
  regularHours: number | null
  renderedHours: string
  values: Record<string, string>
  errors: Record<string, boolean>
}

interface DayPreview {
  dateIso: string
  dayName: string
  hours: number | null
  flags: string[]
}

const DAY_OPTIONS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const GRID_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function formatGridTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function parseSpreadsheetHours(value: unknown, timeFormatted = false): number {
  if (typeof value === 'number') return timeFormatted ? value * 24 : value
  const text = String(value ?? '').trim()
  if (!text) return 0
  const numeric = Number(text)
  if (Number.isFinite(numeric)) return timeFormatted ? numeric * 24 : numeric
  return parseTimeToDecimal(text)
}

function isValidGridTime(value: string): boolean {
  return value === '' || GRID_TIME_PATTERN.test(value)
}

function formatDecimalHoursAsTime(value: number): string {
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const DEFAULT_REST_DAYS: Record<'jan' | 'oms' | 'man', string[]> = {
  jan: ['Sunday'],
  oms: ['Sunday'],
  man: ['Saturday', 'Sunday'],
}

interface EmployeeTimekeep {
  index: number
  empNo: string
  empName: string
  originalValues: any[]
  dayRows: { index: number; originalValues: any[] }[]
  restDays: string[]
  hasAbsences: boolean
  absences: AbsenceEntry[]
  hasUndertime: boolean
  undertimes: UndertimeEntry[]
  janitorialDays: JanitorialDayEntry[]
  hasOvertime: boolean
  overtimes: OvertimeEntry[]
  hasNightDifferential: boolean
  nightDifferentials: NightDifferentialEntry[]
  remarks: string
}

interface CategoryData {
  key: 'jan' | 'oms' | 'man'
  label: string
  employees: EmployeeTimekeep[]
  billingRows: BillingRow[]
}

interface DateRangeOption {
  label: string
  sheetLabel: string
}

const OT_TYPES = [
  'Regular OT',
  'Regular Rest Day OT',
  'Special Holiday OT',
  'Special Holiday Excess OT',
  'Legal Holiday OT',
  'Legal Holiday Excess OT',
]

function parseTimeToDecimal(time: string): number {
  if (!time) return 0
  const parts = time.split(':').map(Number)
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  const seconds = parts[2] ?? 0
  return hours + minutes / 60 + seconds / 3600
}

// Excel stores TIMES as fractions of a day, so a time-formatted cell renders `n`
// (decimal hours) as `n * 24` hours (3h -> 72:00, 8h -> 192:00). Use this for
// OT cells only; regular-hours/UT/absent/ND cells are number-formatted and keep
// plain decimal hours (so 8 stays 8, not 0.333).
function parseTimeToExcelDays(time: string): number {
  return parseTimeToDecimal(time) / 24
}

function excelSerialToIso(value: unknown): string | null {
  const n = typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null
  return DateTime.fromMillis(Math.round((n - 25569) * 86400000), { zone: 'utc' }).toISODate()
}

const NIGHT_DIFF_TYPES = [
  'Night Differential',
  'Night Differential Overtime',
  'Night Differential Rest Day Overtime',
  'Night Differential Special Holiday Overtime',
  'Night Differential Special Holiday Overtime Excess',
  'Night Differential Legal Holiday Overtime',
  'Night Differential Legal Holiday Overtime Excess',
]

type CategoryKey = 'jan' | 'oms' | 'man'

interface DayColumnConfig {
  minLength: number
  utCol: number
  absentCol: number
  otCols: Record<string, number>
  ndCols: Record<string, number>
}

const DAY_COLUMN_CONFIG: Record<CategoryKey, DayColumnConfig> = {
  jan: {
    minLength: 53,
    utCol: 22,
    absentCol: 23,
    otCols: {
      'Regular OT': 5,
      'Regular Rest Day OT': 6,
      'Special Holiday OT': 8,
      'Special Holiday Excess OT': 9,
      'Legal Holiday OT': 10,
      'Legal Holiday Excess OT': 11,
    },
    ndCols: {
      'Night Differential': 15,
      'Night Differential Overtime': 16,
      'Night Differential Legal Holiday Overtime': 17,
      'Night Differential Rest Day Overtime': 18,
      'Night Differential Special Holiday Overtime': 19,
      'Night Differential Special Holiday Overtime Excess': 20,
    },
  },
  oms: {
    minLength: 45,
    utCol: 20,
    absentCol: 21,
    otCols: {
      'Regular OT': 4,
      'Regular Rest Day OT': 5,
      'Special Holiday OT': 6,
      'Special Holiday Excess OT': 7,
      'Legal Holiday OT': 8,
      'Legal Holiday Excess OT': 9,
    },
    ndCols: {
      'Night Differential': 11,
      'Night Differential Overtime': 12,
      'Night Differential Rest Day Overtime': 13,
      'Night Differential Special Holiday Overtime': 14,
      'Night Differential Special Holiday Overtime Excess': 15,
      'Night Differential Legal Holiday Overtime': 16,
      'Night Differential Legal Holiday Overtime Excess': 17,
    },
  },
  man: {
    minLength: 43,
    utCol: 19,
    absentCol: 20,
    otCols: {
      'Regular OT': 4,
      'Regular Rest Day OT': 5,
      'Special Holiday OT': 6,
      'Special Holiday Excess OT': 7,
      'Legal Holiday OT': 8,
      'Legal Holiday Excess OT': 9,
    },
    ndCols: {
      'Night Differential Overtime': 11,
      'Night Differential Rest Day Overtime': 12,
      'Night Differential Special Holiday Overtime': 13,
      'Night Differential Special Holiday Overtime Excess': 14,
      'Night Differential Legal Holiday Overtime': 15,
      'Night Differential Legal Holiday Overtime Excess': 16,
    },
  },
}

/**
 * Column map for the billing file's per-employee aggregate tables
 * (jBillingTable/oBillingTable/mBillingTable), 0-based with column B = index 0.
 * Billing rows are matched by employee number, and formula columns
 * (jan 4/6, oms 1/4) are protected backend-side via DOF_BILLING_FORMULA_INDICES.
 */
interface BillingColumnConfig {
  minLength: number
  hoursCol: number | null
  utCol: number | null
  otCols: Record<string, number>
  ndCols: Record<string, number>
}

const BILLING_COLUMN_CONFIG: Record<CategoryKey, BillingColumnConfig> = {
  jan: {
    minLength: 19,
    hoursCol: 5,
    utCol: null,
    otCols: {
      'Regular OT': 7,
      'Regular Rest Day OT': 8,
      'Special Holiday OT': 10,
      'Special Holiday Excess OT': 11,
      'Legal Holiday OT': 12,
      'Legal Holiday Excess OT': 13,
    },
    ndCols: {
      'Night Differential': 14,
      'Night Differential Overtime': 15,
      'Night Differential Rest Day Overtime': 16,
      'Night Differential Legal Holiday Overtime': 17,
      'Night Differential Special Holiday Overtime': 18,
    },
  },
  oms: {
    minLength: 24,
    hoursCol: null,
    utCol: 5,
    otCols: {
      'Regular OT': 6,
      'Regular Rest Day OT': 7,
      'Special Holiday OT': 9,
      'Special Holiday Excess OT': 10,
      'Legal Holiday OT': 11,
      'Legal Holiday Excess OT': 13,
    },
    ndCols: {
      'Night Differential': 14,
      'Night Differential Overtime': 15,
      'Night Differential Rest Day Overtime': 16,
      'Night Differential Special Holiday Overtime': 18,
      'Night Differential Special Holiday Overtime Excess': 20,
      'Night Differential Legal Holiday Overtime': 21,
      'Night Differential Legal Holiday Overtime Excess': 23,
    },
  },
  man: {
    minLength: 20,
    hoursCol: null,
    utCol: 4,
    otCols: {
      'Regular OT': 5,
      'Regular Rest Day OT': 6,
      'Special Holiday OT': 8,
      'Special Holiday Excess OT': 9,
      'Legal Holiday OT': 10,
      'Legal Holiday Excess OT': 11,
    },
    ndCols: {},
  },
}

@Component({
  selector: 'app-dof-timekeeping',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    MatTabsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './dof-timekeeping.html',
  styleUrl: './dof-timekeeping.css',
})
export class DofTimekeepingComponent {
  private dofBilling = inject(DofBilling)
  private router = inject(Router)
  private gridRowCache = new WeakMap<EmployeeTimekeep, Map<CategoryKey, GridRow[]>>()

  readonly code = 'DOF'

  readonly timekeepingFileKeys: ('jan' | 'oms' | 'man')[] = ['jan', 'oms', 'man']

  step = signal<'setup' | 'loading' | 'editing' | 'saving' | 'done'>('setup')

  timekeepingFiles = signal<DofTimekeepingFiles | null>(null)
  billingFile = signal<{ documentId: string; editUrl: string; fileName: string } | null>(null)

  selectedYear = signal<number>(DateTime.now().year)
  selectedMonth = signal<number>(DateTime.now().month)
  selectedPeriod = signal<'first' | 'second'>('first')
  dateRange = signal<DateRangeOption>({ label: '', sheetLabel: '' })
  entryView = signal<'grid' | 'form'>('grid')

  categories = signal<CategoryData[]>([
    { key: 'jan', label: 'JAN', employees: [], billingRows: [] },
    { key: 'oms', label: 'OMS', employees: [], billingRows: [] },
    { key: 'man', label: 'MAN', employees: [], billingRows: [] },
  ])

  lastDayOfMonth = computed(() => {
    const dt = DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth() })
    return dt.daysInMonth ?? 31
  })

  yearOptions = Array.from({ length: 5 }, (_, i) => DateTime.now().year - 2 + i)
  monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: DateTime.fromObject({ month: i + 1 }).toFormat('MMMM'),
  }))

  constructor() {
    this.updateDateRange()
  }

  private getMonthName(month: number): string {
    return DateTime.fromObject({ month }).toFormat('MMMM')
  }

  private getBillingPeriod(): string {
    const dt = DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth() })
    if (this.selectedPeriod() === 'first') {
      return '1-15'
    }
    return `16-${dt.daysInMonth ?? 31}`
  }

  private getPeriodDates(): DateTime[] {
    const dt = DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth() })
    let startDay: number
    let endDay: number

    if (this.selectedPeriod() === 'first') {
      startDay = 1
      endDay = 15
    } else {
      startDay = 16
      endDay = dt.daysInMonth ?? 31
    }

    const dates: DateTime[] = []
    for (let day = startDay; day <= endDay; day++) {
      dates.push(DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth(), day }))
    }
    return dates
  }

  private isRestDayByDate(date: DateTime, restDays: string[]): boolean {
    const dayName = date.toFormat('cccc')
    return restDays.includes(dayName)
  }

  updateDateRange() {
    const dt = DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth() })
    const monthFull = dt.toFormat('MMMM')
    const daysInMonth = dt.daysInMonth!

    let label: string
    let sheetLabel: string

    if (this.selectedPeriod() === 'first') {
      label = `${monthFull} 1-15, ${dt.year}`
      sheetLabel = `${monthFull} 1-15`
    } else {
      label = `${monthFull} 16-${daysInMonth}, ${dt.year}`
      sheetLabel = `${monthFull} 16-${daysInMonth}`
    }

    this.dateRange.set({ label, sheetLabel })
  }

  async createBilling() {
    this.step.set('loading')

    try {
      const timekeeping = await this.dofBilling.createTimekeeping(this.code, {
        dateRange: this.dateRange(),
        year: this.selectedYear(),
        month: this.getMonthName(this.selectedMonth()),
        billingPeriod: this.getBillingPeriod(),
      })

      this.timekeepingFiles.set(timekeeping)

      const billing = await this.dofBilling.createBilling(this.code, {
        dateRange: this.dateRange(),
      })

      this.billingFile.set(billing)

      const timekeepingIds = {
        jan: timekeeping.jan.documentId,
        oms: timekeeping.oms.documentId,
        man: timekeeping.man.documentId,
      }

      await this.dofBilling.setupBilling(null, billing.documentId, {
        dateRange: this.dateRange(),
        timekeepingFiles: timekeepingIds,
        year: this.selectedYear(),
        month: this.getMonthName(this.selectedMonth()),
        billingPeriod: this.getBillingPeriod(),
      })

      const tables = await this.dofBilling.getTables(billing.documentId, timekeepingIds)

      this.categories.set([
        { key: 'jan', label: 'JAN', employees: this.mapRowsToEmployees(tables.jan, 'jan'), billingRows: tables.janBilling },
        { key: 'oms', label: 'OMS', employees: this.mapRowsToEmployees(tables.oms, 'oms'), billingRows: tables.omsBilling },
        { key: 'man', label: 'MAN', employees: this.mapRowsToEmployees(tables.man, 'man'), billingRows: tables.manBilling },
      ])

      this.step.set('editing')
    } catch (e) {
      console.error(e)
      toast.error('Failed to create DOF billing files')
      this.step.set('setup')
    }
  }

  private mapRowsToEmployees(rows: any[], category: 'jan' | 'oms' | 'man'): EmployeeTimekeep[] {
    const employees: EmployeeTimekeep[] = []
    for (let i = 0; i < rows.length; i += 16) {
      const block = rows.slice(i, i + 16)
      const header = block[0]
      if (!header) continue
      const empNo = header.values[0] ?? ''
      const empName = header.values[1] ?? ''
      const emp: EmployeeTimekeep = {
        index: header.index,
        empNo,
        empName,
        originalValues: [...(header.values ?? [])],
        dayRows: block.map(row => ({
          index: row.index,
          originalValues: [...(row.values ?? [])],
        })),
        restDays: [...DEFAULT_REST_DAYS[category]],
        hasAbsences: false,
        absences: [],
        hasUndertime: false,
        undertimes: [],
        janitorialDays: this.getPeriodDates().map(date => ({
          date: date.toISODate() ?? '',
          checked: false,
          hours: '',
        })),
        hasOvertime: false,
        overtimes: [],
        hasNightDifferential: false,
        nightDifferentials: [],
        remarks: category === 'jan' ? header.values?.[45] ?? '' : '',
      }
      this.hydrateEmployeeEntries(emp, category)
      employees.push(emp)
    }
    return employees
  }

  private hydrateEmployeeEntries(emp: EmployeeTimekeep, category: CategoryKey) {
    const config = DAY_COLUMN_CONFIG[category]
    const rowDates = this.getEmployeeRowDates(emp)

    emp.dayRows.forEach((row, index) => {
      const dateIso = rowDates[index] ?? ''
      if (!dateIso) return
      const values = row.originalValues

      if (Number(values[config.absentCol]) > 0) {
        emp.absences.push({ date: dateIso })
      }

      const undertime = parseSpreadsheetHours(values[config.utCol])
      if (Number.isFinite(undertime) && undertime > 0) {
        emp.undertimes.push({ date: dateIso, time: formatDecimalHoursAsTime(Math.max(0, 8 - undertime)) })
      }

      for (const [type, column] of Object.entries(config.otCols)) {
        const hours = parseSpreadsheetHours(values[column], true)
        if (Number.isFinite(hours) && hours > 0) {
          emp.overtimes.push({ type, date: dateIso, time: formatDecimalHoursAsTime(hours) })
        }
      }

      for (const [type, column] of Object.entries(config.ndCols)) {
        const hours = parseSpreadsheetHours(values[column])
        if (Number.isFinite(hours) && hours > 0) {
          emp.nightDifferentials.push({ type, date: dateIso, time: formatDecimalHoursAsTime(hours) })
        }
      }

      if (category === 'jan') {
        const janitorialDay = emp.janitorialDays.find(day => day.date === dateIso)
        const hours = parseSpreadsheetHours(values[3])
        if (janitorialDay && Number.isFinite(hours) && hours > 0) {
          janitorialDay.checked = hours === 8
          janitorialDay.hours = formatDecimalHoursAsTime(hours)
        }
      }
    })

    emp.hasAbsences = emp.absences.length > 0
    emp.hasUndertime = emp.undertimes.length > 0
    emp.hasOvertime = emp.overtimes.length > 0
    emp.hasNightDifferential = emp.nightDifferentials.length > 0
  }

  gridColumns(category: CategoryKey): GridColumn[] {
    const columns: GridColumn[] = [{ key: 'regularHours', label: 'Reg' }]

    if (category === 'jan') {
      columns.push({ key: 'renderedHours', label: 'Rendered', kind: 'renderedHours' })
    }

    columns.push({ key: 'undertime', label: 'UT', kind: 'undertime' })
    OT_TYPES.forEach((type, index) => columns.push({
      key: `overtime-${index}`,
      label: type.replace('Regular ', 'Reg '),
      kind: 'overtime',
      entryType: type,
    }))

    if (category !== 'man') {
      NIGHT_DIFF_TYPES.forEach((type, index) => columns.push({
        key: `night-differential-${index}`,
        label: type.replace('Night Differential', 'ND'),
        kind: 'nightDifferential',
        entryType: type,
      }))
    }

    return columns
  }

  gridRows(emp: EmployeeTimekeep, category: CategoryKey): GridRow[] {
    let categoryRows = this.gridRowCache.get(emp)
    if (!categoryRows) {
      categoryRows = new Map<CategoryKey, GridRow[]>()
      this.gridRowCache.set(emp, categoryRows)
    }

    const cached = categoryRows.get(category)
    if (cached) return cached
    const rows = this.buildGridRows(emp, category)
    categoryRows.set(category, rows)
    return rows
  }

  invalidateGrid(emp: EmployeeTimekeep) {
    this.gridRowCache.delete(emp)
  }

  private buildGridRows(emp: EmployeeTimekeep, category: CategoryKey): GridRow[] {
    const dates = this.getPeriodDates()
    const periodDates = new Set(dates.map(date => date.toISODate()))
    const rowDates = this.getEmployeeRowDates(emp)
    const columns = this.gridColumns(category)

    return emp.dayRows.map((_, index) => {
      const dateIso = rowDates[index] ?? ''
      const date = dateIso ? DateTime.fromISO(dateIso) : null
      const isInPeriod = Boolean(date?.isValid && periodDates.has(dateIso))
      const isRestDay = isInPeriod && this.isRestDayByDate(date!, emp.restDays)
      const isAbsent = isInPeriod && category !== 'jan' && emp.absences.some(entry => entry.date === dateIso)
      const janitorialDay = category === 'jan'
        ? emp.janitorialDays.find(entry => entry.date === dateIso)
        : undefined
      const isFullDay = Boolean(janitorialDay?.checked)
      const renderedHours = janitorialDay?.hours ?? ''
      const parsedRenderedHours = renderedHours ? parseTimeToDecimal(renderedHours) : NaN
      let regularHours: number | null = null

      if (isInPeriod) {
        if (category === 'jan') {
          regularHours = isFullDay ? 8 : Number.isFinite(parsedRenderedHours) && parsedRenderedHours > 0 ? parsedRenderedHours : null
        } else if (isAbsent) {
          regularHours = 0
        } else if (!isRestDay) {
          regularHours = 8
        }
      }

      const values: Record<string, string> = {}
      const errors: Record<string, boolean> = {}
      for (const column of columns) {
        if (column.kind) {
          values[column.key] = this.getGridTimeValue(emp, dateIso, column)
          errors[column.key] = !isValidGridTime(values[column.key])
        }
      }

      return {
        dateIso,
        dayName: date?.isValid ? date.toFormat('cccc') : '',
        dayShort: date?.isValid ? date.toFormat('ccc') : '',
        isRestDay,
        isAbsent,
        isFullDay,
        isInPeriod,
        regularHours,
        renderedHours,
        values,
        errors,
      }
    })
  }

  private getEmployeeRowDates(emp: EmployeeTimekeep): string[] {
    const dates = this.getPeriodDates()
    return emp.dayRows.map((row, index) =>
      excelSerialToIso(row.originalValues?.[2]) ?? dates[index]?.toISODate() ?? ''
    )
  }

  private getGridEntries(emp: EmployeeTimekeep, column: GridColumn): Array<UndertimeEntry | OvertimeEntry | NightDifferentialEntry> {
    if (column.kind === 'overtime') return emp.overtimes
    if (column.kind === 'nightDifferential') return emp.nightDifferentials
    return emp.undertimes
  }

  private getGridTimeValue(emp: EmployeeTimekeep, dateIso: string, column: GridColumn): string {
    if (!dateIso || !column.kind) return ''

    if (column.kind === 'renderedHours') {
      return emp.janitorialDays.find(day => day.date === dateIso)?.hours ?? ''
    }

    const total = this.getGridEntries(emp, column)
      .filter(entry => entry.date === dateIso && (!column.entryType || ('type' in entry && entry.type === column.entryType)))
      .reduce((sum, entry) => sum + parseTimeToDecimal(entry.time), 0)
    return total > 0 ? formatDecimalHoursAsTime(total) : ''
  }

  onGridTimeInput(emp: EmployeeTimekeep, row: GridRow, column: GridColumn, value: string) {
    const normalized = formatGridTimeInput(value)
    row.values[column.key] = normalized
    if (!GRID_TIME_PATTERN.test(normalized)) {
      row.errors[column.key] = true
      return
    }
    if (!this.canSetGridTimeValue(emp, row.dateIso, column, normalized)) {
      row.errors[column.key] = true
      return
    }
    row.errors[column.key] = false
    this.setGridTimeValue(emp, row.dateIso, column, normalized)
  }

  private canSetGridTimeValue(emp: EmployeeTimekeep, dateIso: string, column: GridColumn, value: string): boolean {
    if (column.kind === 'renderedHours') return true
    const matching = this.getGridEntries(emp, column).filter(entry => entry.date === dateIso && (!column.entryType || 'type' in entry && entry.type === column.entryType))
    const otherTotal = matching.slice(1).reduce((sum, entry) => sum + parseTimeToDecimal(entry.time), 0)
    return matching.length === 0 || parseTimeToDecimal(value) > otherTotal
  }

  onGridTimeBlur(emp: EmployeeTimekeep, row: GridRow, column: GridColumn) {
    if (GRID_TIME_PATTERN.test(row.values[column.key]) && !row.errors[column.key]) return
    row.values[column.key] = this.getGridTimeValue(emp, row.dateIso, column)
    row.errors[column.key] = false
  }

  private setGridTimeValue(emp: EmployeeTimekeep, dateIso: string, column: GridColumn, value: string) {
    if (column.kind === 'renderedHours') {
      const day = emp.janitorialDays.find(entry => entry.date === dateIso)
      if (day && !day.checked) {
        day.hours = value
        this.refreshGridRow(emp, dateIso, column)
      }
      return
    }

    if (column.kind === 'overtime') {
      this.setTypedGridEntry(emp.overtimes, dateIso, column.entryType ?? OT_TYPES[0], value)
      emp.hasOvertime = emp.overtimes.length > 0
      this.refreshGridRow(emp, dateIso, column)
      return
    }

    if (column.kind === 'nightDifferential') {
      this.setTypedGridEntry(emp.nightDifferentials, dateIso, column.entryType ?? NIGHT_DIFF_TYPES[0], value)
      emp.hasNightDifferential = emp.nightDifferentials.length > 0
      this.refreshGridRow(emp, dateIso, column)
      return
    }

    const matching = emp.undertimes.filter(entry => entry.date === dateIso)
    this.setAggregateGridEntries(emp.undertimes, matching, dateIso, value)
    emp.hasUndertime = emp.undertimes.length > 0
    this.refreshGridRow(emp, dateIso, column)
    this.categories.set([...this.categories()])
  }

  private setTypedGridEntry<T extends OvertimeEntry | NightDifferentialEntry>(entries: T[], dateIso: string, type: string, value: string) {
    const matching = entries.filter(entry => entry.date === dateIso && entry.type === type)
    this.setAggregateGridEntries(entries, matching, dateIso, value, type)
  }

  private setAggregateGridEntries<T extends UndertimeEntry | OvertimeEntry | NightDifferentialEntry>(
    entries: T[],
    matching: T[],
    dateIso: string,
    value: string,
    type?: string
  ) {
    if (!value) {
      for (const entry of matching) entries.splice(entries.indexOf(entry), 1)
      return
    }

    if (matching.length === 0) {
      entries.push({ date: dateIso, time: value, ...(type ? { type } : {}) } as T)
      return
    }

    const otherTotal = matching.slice(1).reduce((sum, entry) => sum + parseTimeToDecimal(entry.time), 0)
    const firstValue = parseTimeToDecimal(value) - otherTotal
    if (firstValue > 0) {
      matching[0].time = formatDecimalHoursAsTime(firstValue)
      return
    }

    for (const entry of matching) entries.splice(entries.indexOf(entry), 1)
  }

  private refreshGridRow(emp: EmployeeTimekeep, dateIso: string, column: GridColumn) {
    const categoryRows = this.gridRowCache.get(emp)
    if (!categoryRows) return
    for (const rows of categoryRows.values()) {
      const row = rows.find(entry => entry.dateIso === dateIso)
      if (row && column.kind) row.values[column.key] = this.getGridTimeValue(emp, dateIso, column)
    }
  }

  onGridFullDayToggle(emp: EmployeeTimekeep, row: GridRow, checked: boolean) {
    const day = emp.janitorialDays.find(entry => entry.date === row.dateIso)
    if (!day) return
    day.checked = checked
    day.hours = checked ? '8:00' : ''
    this.invalidateGrid(emp)
    this.categories.set([...this.categories()])
  }

  onGridAbsenceToggle(emp: EmployeeTimekeep, row: GridRow, checked: boolean) {
    emp.absences = emp.absences.filter(entry => entry.date !== row.dateIso)
    if (checked) emp.absences.push({ date: row.dateIso })
    emp.hasAbsences = emp.absences.length > 0
    this.invalidateGrid(emp)
    this.categories.set([...this.categories()])
  }

  selectGridInput(event: Event) {
    const input = event.target as HTMLInputElement | null
    input?.select()
  }

  clearGridCell(emp: EmployeeTimekeep, row: GridRow, column: GridColumn) {
    if (!column.kind) return
    row.values[column.key] = ''
    row.errors[column.key] = false
    this.setGridTimeValue(emp, row.dateIso, column, '')
  }

  onGridKeydown(
    event: KeyboardEvent,
    category: CategoryKey,
    employeeIndex: number,
    rowIndex: number,
    columnIndex: number,
    emp?: EmployeeTimekeep,
    row?: GridRow,
    column?: GridColumn
  ) {
    if (event.key === 'Delete' && emp && row && column) {
      event.preventDefault()
      this.clearGridCell(emp, row, column)
      return
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'Enter') {
        event.preventDefault()
        void this.saveTimekeeperData()
      }
      return
    }

    let targetRow = rowIndex
    let targetColumn = columnIndex
    if (event.key === 'Enter' || event.key === 'ArrowDown') targetRow = rowIndex + 1
    if (event.key === 'ArrowUp') targetRow = rowIndex - 1
    if (event.key === 'ArrowRight' && !event.shiftKey) targetColumn = columnIndex + 1
    if (event.key === 'ArrowLeft' && !event.shiftKey) targetColumn = columnIndex - 1
    if (targetRow === rowIndex && targetColumn === columnIndex) return

    event.preventDefault()
    const next = document.querySelector<HTMLInputElement>(
      `[data-grid-cell="${category}-${employeeIndex}-${targetRow}-${targetColumn}"]`
    )
    next?.focus()
    next?.select()
  }

  setEntryView(view: 'grid' | 'form') {
    for (const category of this.categories()) {
      for (const employee of category.employees) this.invalidateGrid(employee)
    }
    this.entryView.set(view)
  }

  addAbsenceDate(emp: EmployeeTimekeep) {
    emp.absences.push({ date: '' })
    this.categories.set([...this.categories()])
  }

  removeAbsenceDate(emp: EmployeeTimekeep, idx: number) {
    emp.absences.splice(idx, 1)
    this.categories.set([...this.categories()])
  }

  addUndertimeDate(emp: EmployeeTimekeep) {
    emp.undertimes.push({ date: '', time: '' })
    this.categories.set([...this.categories()])
  }

  removeUndertimeDate(emp: EmployeeTimekeep, idx: number) {
    emp.undertimes.splice(idx, 1)
    this.categories.set([...this.categories()])
  }

  addOvertime(emp: EmployeeTimekeep) {
    emp.overtimes.push({ type: OT_TYPES[0], date: '', time: '' })
    this.categories.set([...this.categories()])
  }

  removeOvertime(emp: EmployeeTimekeep, idx: number) {
    emp.overtimes.splice(idx, 1)
    this.categories.set([...this.categories()])
  }

  addNightDifferential(emp: EmployeeTimekeep) {
    emp.nightDifferentials.push({ type: NIGHT_DIFF_TYPES[0], date: '', time: '' })
    this.categories.set([...this.categories()])
  }

  removeNightDifferential(emp: EmployeeTimekeep, idx: number) {
    emp.nightDifferentials.splice(idx, 1)
    this.categories.set([...this.categories()])
  }

  toggleRestDay(emp: EmployeeTimekeep, day: string) {
    const idx = emp.restDays.indexOf(day)
    if (idx >= 0) {
      emp.restDays.splice(idx, 1)
    } else {
      emp.restDays.push(day)
    }
    this.invalidateGrid(emp)
    this.categories.set([...this.categories()])
  }

  toggleJanitorialDay(emp: EmployeeTimekeep, day: JanitorialDayEntry) {
    day.checked = !day.checked
    if (day.checked) {
      day.hours = '8:00'
    } else {
      day.hours = ''
    }
    this.categories.set([...this.categories()])
  }

  computeRegularHours(emp: EmployeeTimekeep, category: 'jan' | 'oms' | 'man'): number {
    if (category === 'jan') {
      return emp.janitorialDays.reduce((sum, day) => {
        if (day.checked) return sum + 8
        const hours = parseTimeToDecimal(day.hours)
        return sum + (Number.isFinite(hours) ? hours : 0)
      }, 0)
    }

    const workingDays = this.getPeriodDates().filter(d => !this.isRestDayByDate(d, emp.restDays)).length
    let total = workingDays * 8

    for (const entry of emp.absences) {
      if (this.isRestDayByDate(DateTime.fromISO(entry.date), emp.restDays)) continue
      total -= 8
    }

    for (const entry of emp.undertimes) {
      if (this.isRestDayByDate(DateTime.fromISO(entry.date), emp.restDays)) continue
      total -= (8 - parseTimeToDecimal(entry.time))
    }

    return Math.max(total, 0)
  }

  buildDayPreview(emp: EmployeeTimekeep, category: CategoryKey): DayPreview[] {
    const dates = this.getPeriodDates()
    const periodDates = new Set(dates.map(d => d.toISODate()))

    const rowDates = emp.dayRows.map((row, i) =>
      excelSerialToIso(row.originalValues?.[2]) ?? dates[i]?.toISODate() ?? ''
    )

    return emp.dayRows.map((_, i) => {
      const dateIso = rowDates[i] ?? ''
      const date = dateIso ? DateTime.fromISO(dateIso) : null

      if (!date?.isValid || !periodDates.has(dateIso)) {
        return { dateIso, dayName: date?.isValid ? date.toFormat('ccc') : '', hours: null, flags: ['—'] }
      }

      const flags: string[] = []
      const isRest = this.isRestDayByDate(date, emp.restDays)
      const hasAbsence = emp.absences.some(a => a.date === dateIso)

      let hours: number | null = 8
      if (category === 'jan') {
        const janDay = emp.janitorialDays.find(d => d.date === dateIso)
        if (janDay?.checked) {
          hours = 8
        } else if (janDay?.hours) {
          const parsed = parseTimeToDecimal(janDay.hours)
          hours = Number.isFinite(parsed) && parsed > 0 ? parsed : null
        } else {
          hours = null
        }
      } else if (hasAbsence) {
        hours = 0
        flags.push('Absent')
      } else if (isRest) {
        hours = null
        flags.push('Rest Day')
      }

      const undertime = emp.undertimes.find(u => u.date === dateIso)
      if (undertime) flags.push(`UT ${undertime.time}`)

      const otTotal = emp.overtimes
        .filter(o => o.date === dateIso)
        .reduce((sum, o) => sum + parseTimeToDecimal(o.time), 0)
      if (otTotal > 0) flags.push(`OT ${Math.round(otTotal * 100) / 100}h`)

      const ndTotal = emp.nightDifferentials
        .filter(n => n.date === dateIso)
        .reduce((sum, n) => sum + parseTimeToDecimal(n.time), 0)
      if (ndTotal > 0) flags.push(`ND ${Math.round(ndTotal * 100) / 100}h`)

      return { dateIso, dayName: date.toFormat('ccc'), hours, flags }
    })
  }

  async saveTimekeeperData() {
    const files = this.timekeepingFiles()
    const billing = this.billingFile()
    if (!files || !billing) {
      toast.error('Something went wrong')
      return
    }

    const periodDates = new Set(this.getPeriodDates().map(d => d.toISODate()))
    const unmatched: string[] = []
    for (const cat of this.categories()) {
      for (const emp of cat.employees) {
        const label = `${cat.label} ${emp.empNo} ${emp.empName}`.trim()
        for (const a of emp.absences) {
          if (a.date && !periodDates.has(a.date)) unmatched.push(`${label} absence ${a.date}`)
        }
        for (const u of emp.undertimes) {
          if (u.date && !periodDates.has(u.date)) unmatched.push(`${label} undertime ${u.date}`)
        }
        for (const o of emp.overtimes) {
          if (o.date && !periodDates.has(o.date)) unmatched.push(`${label} overtime ${o.date}`)
        }
        for (const n of emp.nightDifferentials) {
          if (n.date && !periodDates.has(n.date)) unmatched.push(`${label} night differential ${n.date}`)
        }
      }
    }
    if (unmatched.length > 0) {
      const preview = unmatched.slice(0, 3).join('; ')
      toast.warning(
        `${unmatched.length} ${unmatched.length === 1 ? 'entry is' : 'entries are'} outside the billing period and will not be saved: ${preview}${unmatched.length > 3 ? '; …' : ''}`
      )
    }

    this.step.set('saving')

    try {
      const timekeepingIds = {
        jan: files.jan.documentId,
        oms: files.oms.documentId,
        man: files.man.documentId,
      }

      const unmatchedBilling: string[] = []
      const payload = {
        janRows: this.buildRows('jan'),
        omsRows: this.buildRows('oms'),
        manRows: this.buildRows('man'),
        janBillingRows: this.buildBillingRows('jan', unmatchedBilling),
        omsBillingRows: this.buildBillingRows('oms', unmatchedBilling),
        manBillingRows: this.buildBillingRows('man', unmatchedBilling),
        timekeepingFiles: timekeepingIds,
      }

      const totalBillingRows =
        payload.janBillingRows.length + payload.omsBillingRows.length + payload.manBillingRows.length
      const totalEmployees = this.categories().reduce((n, c) => n + c.employees.length, 0)

      if (totalEmployees > 0 && totalBillingRows === 0) {
        const preview = unmatchedBilling.slice(0, 3).join('; ')
        toast.error(
          `No employees matched a billing row — the billing file would receive no data. Unmatched: ${preview}${unmatchedBilling.length > 3 ? '; …' : ''}`
        )
        this.step.set('editing')
        return
      }

      if (unmatchedBilling.length > 0) {
        const preview = unmatchedBilling.slice(0, 3).join('; ')
        toast.warning(
          `${unmatchedBilling.length} ${unmatchedBilling.length === 1 ? 'employee has' : 'employees have'} no matching billing row and will not appear in the billing file: ${preview}${unmatchedBilling.length > 3 ? '; …' : ''}`
        )
      }

      await this.dofBilling.saveTables(billing.documentId, payload)

      this.step.set('done')
      toast.success('DOF timekeeping data saved successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save timekeeper data')
      this.step.set('editing')
    }
  }

  private buildRows(category: CategoryKey): DofTableRow[] {
    const cat = this.categories().find(c => c.key === category)
    if (!cat) return []

    return cat.employees.flatMap(emp => this.buildEmployeeRows(emp, category))
  }

  private buildEmployeeRows(emp: EmployeeTimekeep, category: CategoryKey): DofTableRow[] {
    const config = DAY_COLUMN_CONFIG[category]
    const dates = this.getPeriodDates()
    const periodDates = new Set(dates.map(d => d.toISODate()))

    // Resolve each row's date from its own date cell (col 2) so entries land
    // on the row matching the input date; fall back to the sequential period
    // date when the cascade value isn't readable.
    const rowDates = emp.dayRows.map((row, i) =>
      excelSerialToIso(row.originalValues?.[2]) ?? dates[i]?.toISODate() ?? ''
    )

    const blockValues: any[] = [...emp.originalValues]
    while (blockValues.length < config.minLength) blockValues.push(null)
    blockValues[0] = null
    blockValues[1] = emp.empName
    if (category === 'jan') {
      blockValues[2] = null
      blockValues[45] = emp.remarks
    }

    const buildDayValues = (dayIndex: number, baseValues: any[]): any[] => {
      const values: any[] = [...baseValues]
      while (values.length < config.minLength) values.push(null)

      const dateIso = rowDates[dayIndex] ?? ''
      const date = dateIso ? DateTime.fromISO(dateIso) : null

      // Rows outside the billing period (e.g. the 16th row of a 15-day first
      // period, whose cascade date is still valid) stay untouched so no hours
      // or stale template values leak into the file.
      if (!date?.isValid || !periodDates.has(dateIso)) {
        values[3] = null
        values[config.utCol] = null
        values[config.absentCol] = null
        for (const col of Object.values(config.otCols)) values[col] = null
        if (category !== 'man') {
          for (const col of Object.values(config.ndCols)) values[col] = null
        }
        return values
      }

      const isRest = this.isRestDayByDate(date, emp.restDays)
      const hasAbsence = emp.absences.some(a => a.date === dateIso)

      let regularHours: number | null = 8
      if (category === 'jan') {
        const janDay = emp.janitorialDays.find(d => d.date === dateIso)
        if (janDay?.checked) {
          regularHours = 8
        } else if (janDay?.hours) {
          const hours = parseTimeToDecimal(janDay.hours)
          regularHours = Number.isFinite(hours) && hours > 0 ? hours : null
        } else {
          regularHours = null
        }
      } else if (hasAbsence) {
        regularHours = 0
      } else if (isRest) {
        regularHours = null
      }
      values[3] = regularHours

      const undertime = emp.undertimes.find(u => u.date === dateIso)
      values[config.utCol] = undertime ? 8 - parseTimeToDecimal(undertime.time) : null
      values[config.absentCol] = hasAbsence ? 8 : null

      for (const [type, col] of Object.entries(config.otCols)) {
        const total = emp.overtimes
          .filter(o => o.type === type && o.date === dateIso)
          .reduce((sum, o) => sum + parseTimeToExcelDays(o.time), 0)
        values[col] = total > 0 ? total : null
      }

      if (category !== 'man') {
        for (const [type, col] of Object.entries(config.ndCols)) {
          const total = emp.nightDifferentials
            .filter(n => n.type === type && n.date === dateIso)
            .reduce((sum, n) => sum + parseTimeToDecimal(n.time), 0)
          values[col] = total > 0 ? total : null
        }
      }

      return values
    }

    // Row 0 of the block is the period's first day AND carries the block
    // formulas, so day-1 values go into the block row itself.
    const rows: DofTableRow[] = [
      { index: emp.index, values: buildDayValues(0, blockValues), type: 'block' },
    ]

    for (let i = 1; i < emp.dayRows.length; i++) {
      const dayRow = emp.dayRows[i]
      rows.push({ index: dayRow.index, values: buildDayValues(i, dayRow.originalValues), type: 'day' })
    }

    return rows
  }

  /** Normalizes an employee number or name for cross-table matching */
  private normalizeKey(value: unknown): string {
    if (value === null || value === undefined) return ''
    const s = String(value).trim().toLowerCase()
    if (!s) return ''
    // Canonicalize pure numbers so 1001, '1001', '1001.0' and '001001' compare equal
    if (/^\d+(\.\d+)?$/.test(s)) return `num:${Number(s)}`
    return `name:${s.replace(/[^a-z0-9]+/g, ' ').trim()}`
  }

  /**
   * Finds an employee's billing row by identity, never by row index.
   * Billing tables key employees by number (col 0) and carry the name in col 1;
   * timekeeping column 0 is a VLOOKUP whose value may be the name, so both the
   * employee's number and name are tried against both billing columns.
   */
  private findBillingRow(emp: EmployeeTimekeep, billingRows: BillingRow[]): BillingRow | undefined {
    const keys = new Set([this.normalizeKey(emp.empNo), this.normalizeKey(emp.empName)].filter(Boolean))
    return billingRows.find(r => {
      const col0 = this.normalizeKey(r.values?.[0])
      const col1 = this.normalizeKey(r.values?.[1])
      return (col0 !== '' && keys.has(col0)) || (col1 !== '' && keys.has(col1))
    })
  }

  private buildBillingRows(category: CategoryKey, unmatched: string[]): DofBillingTableRow[] {
    const cat = this.categories().find(c => c.key === category)
    if (!cat) return []

    const config = BILLING_COLUMN_CONFIG[category]
    const periodDates = new Set(this.getPeriodDates().map(d => d.toISODate()))

    const rows: DofBillingTableRow[] = []
    for (const emp of cat.employees) {
      // Unmatched employees are reported to the caller so their timekeeping
      // input can't silently miss the billing file.
      const match = this.findBillingRow(emp, cat.billingRows)
      if (!match) {
        unmatched.push(`${cat.label} ${emp.empNo} - ${emp.empName}`.trim())
        continue
      }

      const values: any[] = [...match.values]
      while (values.length < config.minLength) values.push(null)

      if (config.hoursCol !== null) {
        values[config.hoursCol] = this.computeRegularHours(emp, category)
      }

      if (config.utCol !== null) {
        const utTotal = emp.undertimes
          .filter(u => u.date && periodDates.has(u.date))
          .reduce((sum, u) => sum + (8 - parseTimeToDecimal(u.time)), 0)
        values[config.utCol] = utTotal > 0 ? utTotal : null
      }

      for (const [type, col] of Object.entries(config.otCols)) {
        const total = emp.overtimes
          .filter(o => o.type === type && periodDates.has(o.date))
          .reduce((sum, o) => sum + parseTimeToDecimal(o.time), 0)
        values[col] = total > 0 ? total : null
      }

      for (const [type, col] of Object.entries(config.ndCols)) {
        const total = emp.nightDifferentials
          .filter(n => n.type === type && periodDates.has(n.date))
          .reduce((sum, n) => sum + parseTimeToDecimal(n.time), 0)
        values[col] = total > 0 ? total : null
      }

      rows.push({ index: match.index, values })
    }
    return rows
  }

  openTimekeepingFile(key: 'jan' | 'oms' | 'man') {
    const file = this.timekeepingFiles()?.[key]
    if (file?.editUrl) window.open(file.editUrl, '_blank')
  }

  goToDashboard() {
    this.router.navigate(['/dashboard'])
  }

  retry() {
    this.step.set('setup')
    this.timekeepingFiles.set(null)
    this.billingFile.set(null)
  }
}
