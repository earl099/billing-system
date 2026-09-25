import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DofBilling } from '@services/dof-billing';
import { DofTimekeepingComponent } from './dof-timekeeping';

/**
 * Regression guard for the DOF timekeeping Excel output.
 *
 * Two different cell formats live in the same sheet, so the conversion applied
 * to each must differ:
 *  - Overtime cells are Excel TIME-formatted -> they need day-fractions (hours/24).
 *    Decimal hours render ×24 there (3h -> 72:00, 8h -> 192:00).
 *  - Regular-hours, undertime, absent and night-differential cells are NUMBER-formatted
 *    -> they keep plain decimal hours (8 stays 8, not 0.333).
 *
 * These specs drive the real component's row builder and assert the right value
 * lands on the right per-day row with the right scale.
 */
describe('DofTimekeepingComponent overtime/day output', () => {
  let component: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DofTimekeepingComponent],
      providers: [
        { provide: DofBilling, useValue: {} },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(DofTimekeepingComponent).componentInstance;

    // Sep 2026, first period (1-15).
    component.selectedYear.set(2026);
    component.selectedMonth.set(9);
    component.selectedPeriod.set('first');
    component.updateDateRange();

    const emp: any = {
      index: 7,
      empNo: 'E001',
      empName: 'Test Employee',
      originalValues: [],
      // 16 rows per employee: block (day 1) + 15 day rows. Empty date cell ->
      // sequential period dates via the buildDayValues fallback.
      dayRows: Array.from({ length: 16 }, (_, i) => ({ index: 8 + i, originalValues: [] })),
      restDays: ['Sunday'],
      hasAbsences: true,
      absences: [{ date: '2026-09-04' }],
      hasUndertime: true,
      undertimes: [{ date: '2026-09-02', time: '2:00' }],
      janitorialDays: Array.from({ length: 15 }, (_, i) => ({
        date: `2026-09-${String(i + 1).padStart(2, '0')}`,
        checked: false,
        hours: '',
      })),
      hasOvertime: true,
      overtimes: [
        { type: 'Regular OT', date: '2026-09-01', time: '2:00' },
        { type: 'Regular OT', date: '2026-09-03', time: '3:00' },
      ],
      hasNightDifferential: true,
      nightDifferentials: [{ type: 'Night Differential', date: '2026-09-05', time: '1:30' }],
      remarks: '',
    };

    component.categories.set([
      { key: 'oms', label: 'OMS', employees: [emp], billingRows: [] },
      { key: 'jan', label: 'JAN', employees: [], billingRows: [] },
      { key: 'man', label: 'MAN', employees: [], billingRows: [] },
    ]);
  });

  // OMS columns (from DOF_DAY_FORMULA_INDICES).
  const OT_COL = 4;    // Regular OT (time-formatted)
  const REG_COL = 3;   // regular hours (number-formatted)
  const UT_COL = 20;   // undertime hours (number-formatted)
  const ABSENT_COL = 21;
  const ND_COL = 11;   // Night Differential (number-formatted)

  it('writes each day\'s overtime as an Excel day-fraction, not decimal hours', () => {
    const rows: any[] = component.buildRows('oms');

    // row 0 = Sep 1, row 2 = Sep 3. 2:00 -> 2/24; 3:00 -> 3/24.
    // On a time-formatted cell, the old decimal-hours value displayed ×24.
    expect(rows[0].values[OT_COL]).toBeCloseTo(2 / 24, 5);
    expect(rows[2].values[OT_COL]).toBeCloseTo(3 / 24, 5);
    expect(rows[0].values[OT_COL]).not.toBe(2);
    expect(rows[2].values[OT_COL]).not.toBe(3);

    // Per-day: OT appears only on its own row, never aggregated into one cell.
    const otDays = rows.filter((r) => r.values[OT_COL] != null);
    expect(otDays.length).toBe(2);
    expect(rows[1].values[OT_COL]).toBeNull(); // Sep 2 had no OT

    const sum = rows.reduce((s, r) => s + (r.values[OT_COL] ?? 0), 0);
    expect(sum).toBeCloseTo(5 / 24, 5); // 2h + 3h = 5h -> 5/24
  });

  it('keeps regular-hours / UT / absent / ND as decimal hours (number-formatted cells)', () => {
    const rows: any[] = component.buildRows('oms');

    // Regular hours: working day = 8 (NOT 8/24 -> 0.333), absence day = 0.
    expect(rows[0].values[REG_COL]).toBe(8); // Sep 1 working
    expect(rows[3].values[REG_COL]).toBe(0); // Sep 4 absent
    expect(rows[0].values[REG_COL]).not.toBeCloseTo(8 / 24, 1);

    // Undertime: 8 - 2:00 = 6 hours (decimal, not /24).
    expect(rows[1].values[UT_COL]).toBe(6); // Sep 2
    expect(rows[1].values[UT_COL]).not.toBeCloseTo(6 / 24, 1);

    // Absence flag: 8 (decimal, not /24).
    expect(rows[3].values[ABSENT_COL]).toBe(8);

    // Night differential: 1:30 -> 1.5 hours (decimal, not /24).
    expect(rows[4].values[ND_COL]).toBeCloseTo(1.5, 5);
  });

  it('syncs a grid OT cell to the matching per-day entry and Excel row', () => {
    const category = component.categories()[0];
    const emp = category.employees[0];
    const rows = component.gridRows(emp, 'oms');
    const row = rows[0]; // Sep 1
    const column = component.gridColumns('oms').find((entry: any) => entry.key === 'overtime-0');

    component.onGridTimeInput(emp, row, column, '200');

    expect(row.values[column.key]).toBe('02:00');
    expect(emp.overtimes).toEqual([
      { type: 'Regular OT', date: '2026-09-01', time: '02:00' },
      { type: 'Regular OT', date: '2026-09-03', time: '3:00' },
    ]);
    expect(emp.hasOvertime).toBe(true);

    const outputRows = component.buildRows('oms');
    expect(outputRows[0].values[OT_COL]).toBeCloseTo(2 / 24, 5);
  });

  it('keeps partial input uncommitted and restores the last valid value on blur', () => {
    const emp = component.categories()[0].employees[0];
    const rows = component.gridRows(emp, 'oms');
    const column = component.gridColumns('oms').find((entry: any) => entry.key === 'overtime-0');

    component.onGridTimeInput(emp, rows[0], column, '9');
    expect(rows[0].values[column.key]).toBe('9');
    expect(emp.overtimes[0].time).toBe('2:00');

    component.onGridTimeBlur(emp, rows[0], column);
    expect(rows[0].values[column.key]).toBe('02:00');
    expect(emp.overtimes[0].time).toBe('2:00');
  });

  it('preserves duplicate same-day entries when adjusting their combined grid total', () => {
    const emp = component.categories()[0].employees[0];
    emp.overtimes.push({ type: 'Regular OT', date: '2026-09-01', time: '1:00' });
    const rows = component.gridRows(emp, 'oms');
    const column = component.gridColumns('oms').find((entry: any) => entry.key === 'overtime-0');

    expect(rows[0].values[column.key]).toBe('03:00');
    component.onGridTimeInput(emp, rows[0], column, '400');
    expect(emp.overtimes.filter((entry: any) => entry.date === '2026-09-01')).toEqual([
      { type: 'Regular OT', date: '2026-09-01', time: '03:00' },
      { type: 'Regular OT', date: '2026-09-01', time: '1:00' },
    ]);

    component.onGridKeydown(
      { key: 'Delete', preventDefault: () => {} } as any,
      'oms',
      0,
      0,
      component.gridColumns('oms').indexOf(column),
      emp,
      rows[0],
      column
    );
    expect(emp.overtimes.filter((entry: any) => entry.date === '2026-09-01')).toEqual([]);
  });

  it('hydrates existing spreadsheet values into the grid', () => {
    const rows = Array.from({ length: 16 }, (_, index) => {
      const values: any[] = Array.from({ length: 45 }, () => null);
      if (index === 0) {
        values[0] = 'E002';
        values[1] = 'Existing Employee';
        values[4] = 2 / 24;
        values[20] = 6;
        values[21] = 8;
        values[11] = 1.5;
      }
      return { index, values };
    });

    const [employee] = (component as any).mapRowsToEmployees(rows, 'oms');
    expect(employee.overtimes).toEqual([{ type: 'Regular OT', date: '2026-09-01', time: '02:00' }]);
    expect(employee.undertimes).toEqual([{ date: '2026-09-01', time: '02:00' }]);
    expect(employee.absences).toEqual([{ date: '2026-09-01' }]);
    expect(employee.nightDifferentials).toEqual([
      { type: 'Night Differential', date: '2026-09-01', time: '01:30' },
    ]);

    const grid = component.gridRows(employee, 'oms');
    expect(grid[0].values['overtime-0']).toBe('02:00');
    expect(grid[0].values['undertime']).toBe('02:00');
    expect(grid[0].isAbsent).toBe(true);
  });

  it('syncs grid values for UT, ND, absence, and JAN full-day controls', () => {
    const category = component.categories()[0];
    const emp = category.employees[0];
    const columns = component.gridColumns('oms');
    const rows = component.gridRows(emp, 'oms');
    const utColumn = columns.find((entry: any) => entry.key === 'undertime');
    const ndColumn = columns.find((entry: any) => entry.key === 'night-differential-0');

    component.onGridTimeInput(emp, rows[1], utColumn, '130');
    component.onGridTimeInput(emp, rows[4], ndColumn, '145');
    component.onGridAbsenceToggle(emp, rows[3], true);

    expect(emp.undertimes).toEqual([{ date: '2026-09-02', time: '01:30' }]);
    expect(emp.nightDifferentials).toEqual([
      { type: 'Night Differential', date: '2026-09-05', time: '01:45' },
    ]);
    expect(emp.absences).toEqual([{ date: '2026-09-04' }]);
    expect(emp.hasAbsences).toBe(true);

    emp.janitorialDays[0].date = '2026-09-01';
    const janRows = component.gridRows(emp, 'jan');
    component.onGridFullDayToggle(emp, janRows[0], true);
    expect(emp.janitorialDays[0]).toEqual({ date: '2026-09-01', checked: true, hours: '8:00' });
  });
});
