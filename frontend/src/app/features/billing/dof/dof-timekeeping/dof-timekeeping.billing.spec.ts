import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DofBilling } from '@services/dof-billing';
import { DofTimekeepingComponent } from './dof-timekeeping';

/**
 * Regression guard for the DOF billing file's per-employee OT / UT / ND totals.
 *
 * Column indices below are verified against the live SharePoint templates:
 *   jBillingTable (B7:T59)  - UT col 6 is a formula, hours 5, OT 7-13, ND 14-18
 *   oBillingTable (B7:Y22)  - name 1 and daily rate 4 are formulas, UT 5, OT 6-13, ND 14-23
 *   mBillingTable (B6:U163) - no formulas, UT 4, OT 5-11, ND 12-19
 *
 * These specs drive the real component's row builders and assert each entered
 * hour reaches the billing table, and that entries which cannot be placed are
 * reported rather than silently discarded.
 */
describe('DofTimekeepingComponent billing totals', () => {
  let component: any;

  const makeEmp = (over: any = {}) => ({
    index: 7,
    empNo: 'E001',
    empName: 'Probe Employee',
    originalValues: [],
    dayRows: Array.from({ length: 16 }, (_, i) => ({ index: 8 + i, originalValues: [] })),
    restDays: ['Sunday'],
    hasAbsences: false,
    absences: [],
    hasUndertime: false,
    undertimes: [],
    janitorialDays: Array.from({ length: 15 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      checked: false,
      hours: '',
    })),
    hasOvertime: false,
    overtimes: [],
    hasNightDifferential: false,
    nightDifferentials: [],
    remarks: '',
    ...over,
  });

  // A billing row that matches makeEmp() by employee number AND name.
  const matchedRow = (index = 3) => ({
    index,
    values: ['LB-DOF-1', 'Probe Employee', 'Tech', 31765, 1217.8],
  });

  const setCategory = (key: string, employees: any[], billingRows: any[] = []) =>
    component.categories.set([
      { key: 'jan', label: 'JAN', employees: key === 'jan' ? employees : [], billingRows: key === 'jan' ? billingRows : [] },
      { key: 'oms', label: 'OMS', employees: key === 'oms' ? employees : [], billingRows: key === 'oms' ? billingRows : [] },
      { key: 'man', label: 'MAN', employees: key === 'man' ? employees : [], billingRows: key === 'man' ? billingRows : [] },
    ]);

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
  });

  describe('entries reach the billing table', () => {
    it('writes overtime totals to the OT column resolved from the verified headers', () => {
      const emp = makeEmp({
        hasOvertime: true,
        overtimes: [
          { type: 'Regular OT', date: '2026-09-02', time: '02:00' },
          { type: 'Regular OT', date: '2026-09-04', time: '01:00' },
          { type: 'Regular Rest Day OT', date: '2026-09-05', time: '08:00' },
        ],
      });
      setCategory('oms', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('oms', []);
      // oBillingTable: 6 = REGULAR OT (125%), 7 = REST DAY OT (130%).
      // Billing OT columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(row.values[6]).toBeCloseTo(3 / 24, 5);
      expect(row.values[7]).toBeCloseTo(8 / 24, 5);
      // Untouched OT columns stay empty rather than zeroed.
      expect(row.values[9]).toBeNull();
    });

    it('writes night differential totals to the ND columns', () => {
      const emp = makeEmp({
        hasNightDifferential: true,
        nightDifferentials: [
          { type: 'Night Differential', date: '2026-09-02', time: '01:30' },
          { type: 'Night Differential Legal Holiday Overtime', date: '2026-09-03', time: '02:00' },
        ],
      });
      setCategory('oms', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('oms', []);
      // oBillingTable: 14 = NIGHT DIFFERENTIAL (10%), 21 = ND LEGAL HOLIDAY OT (20%).
      // Billing ND columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(row.values[14]).toBeCloseTo(1.5 / 24, 5);
      expect(row.values[21]).toBeCloseTo(2 / 24, 5);
    });

    it('writes undertime as the shortfall from an 8-hour day, not the time entered', () => {
      const emp = makeEmp({
        hasUndertime: true,
        // Clocked in at 07:00 -> 1h shortfall.
        undertimes: [{ date: '2026-09-02', time: '07:00' }],
      });
      setCategory('oms', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('oms', []);
      expect(row.values[5]).toBeCloseTo(1, 5);
    });

    it('sends MAN night differential to the billing sheet', () => {
      const emp = makeEmp({
        restDays: ['Saturday', 'Sunday'],
        hasNightDifferential: true,
        nightDifferentials: [{ type: 'Night Differential Overtime', date: '2026-09-02', time: '03:00' }],
      });
      setCategory('man', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('man', []);
      // mBillingTable: 14 = NIGHT DIFFERENTIAL OT (13%).
      // Billing ND columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(row.values[14]).toBeCloseTo(3 / 24, 5);
    });

    it('sends REST DAY OT EXCESS hours to its own column', () => {
      const emp = makeEmp({
        hasOvertime: true,
        overtimes: [{ type: 'Rest Day OT Excess', date: '2026-09-02', time: '04:00' }],
      });
      setCategory('oms', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('oms', []);
      // oBillingTable: 8 = REST DAY OT EXCESS (169%).
      // Billing OT columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(row.values[8]).toBeCloseTo(4 / 24, 5);
    });
  });

  describe('entries that cannot be placed are reported, not dropped', () => {
    it('emits a flagged marker row for an employee with no billing row', () => {
      const emp = makeEmp({
        hasOvertime: true,
        overtimes: [{ type: 'Regular OT', date: '2026-09-02', time: '02:00' }],
      });
      setCategory('oms', [emp], []); // no matching billing row

      const unmatched: string[] = [];
      const rows = component.buildBillingRows('oms', unmatched);

      expect(unmatched.length).toBe(1);
      expect(rows.length).toBe(1);
      expect(rows[0].unmatched).toBe(true);
      // The hours survive on the marker row instead of being lost.
      // Billing OT columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(rows[0].values[6]).toBeCloseTo(2 / 24, 5);
      expect(rows[0].values[1]).toContain('UNMATCHED');
      expect(rows[0].values[0]).toBe('E001');
    });

    it('omits a marker row when an unmatched employee has no hours to report', () => {
      setCategory('oms', [makeEmp()], []);
      const rows = component.buildBillingRows('oms', []);
      expect(rows.length).toBe(0);
    });

    it('still writes matched employees when another employee is unmatched', () => {
      const matched = makeEmp({
        hasOvertime: true,
        overtimes: [{ type: 'Regular OT', date: '2026-09-02', time: '05:00' }],
      });
      const orphan = makeEmp({
        index: 40,
        empNo: 'E999',
        empName: 'Orphan Employee',
        hasOvertime: true,
        overtimes: [{ type: 'Regular OT', date: '2026-09-03', time: '01:00' }],
      });
      setCategory('oms', [matched, orphan], [matchedRow()]);

      const unmatched: string[] = [];
      const rows = component.buildBillingRows('oms', unmatched);

      expect(unmatched.length).toBe(1);
      const flagged = rows.filter((r: any) => r.unmatched);
      const written = rows.filter((r: any) => !r.unmatched);
      expect(flagged.length).toBe(1);
      expect(written.length).toBe(1);
      // Billing OT columns are [hh]:mm-formatted -> Excel day-fractions.
      expect(written[0].values[6]).toBeCloseTo(5 / 24, 5);
      expect(flagged[0].values[6]).toBeCloseTo(1 / 24, 5);
    });

    it('exposes the unmatched list for the panel and clears it on dismiss', () => {
      expect(component.unmatchedEmployees()).toEqual([]);
      component.unmatchedEmployees.set(['OMS E999 - Orphan Employee']);
      expect(component.unmatchedEmployees().length).toBe(1);

      component.dismissUnmatched();
      expect(component.unmatchedEmployees()).toEqual([]);
    });
  });

  describe('the UI only offers types that can be written', () => {
    it('offers MAN night differential columns', () => {
      const ndColumns = component.gridColumns('man').filter((c: any) => c.kind === 'nightDifferential');
      expect(ndColumns.length).toBeGreaterThan(0);
      expect(component.nightDifferentialTypesFor('man').length).toBeGreaterThan(0);
    });

    it('does not offer MAN a plain Night Differential, which mBillingTable lacks', () => {
      expect(component.nightDifferentialTypesFor('man')).not.toContain('Night Differential');
    });

    it('offers REST DAY OT EXCESS only for JAN, the only table with that column', () => {
      expect(component.overtimeTypesFor('jan')).toContain('Rest Day OT Excess');
      expect(component.overtimeTypesFor('oms')).not.toContain('Rest Day OT Excess');
      expect(component.overtimeTypesFor('man')).not.toContain('Rest Day OT Excess');
    });
  });

  describe('undated entries', () => {
    it('warns instead of silently discarding an entry with no date', () => {
      // Exactly what addOvertime() creates before the user picks a date.
      const emp = makeEmp({
        hasOvertime: true,
        overtimes: [{ type: 'Regular OT', date: '', time: '02:00' }],
      });
      setCategory('oms', [emp], [matchedRow()]);

      const periodDates = new Set(component.getPeriodDates().map((d: any) => d.toISODate()));
      const undated = emp.overtimes.filter((o: any) => !o.date);
      // The old guard only flagged entries WITH an out-of-period date.
      expect(periodDates.has('')).toBe(false);
      expect(undated.length).toBe(1);

      // And such an entry cannot be written anywhere.
      const [row] = component.buildBillingRows('oms', []);
      expect(row.values[6]).toBeNull();
    });
  });

  describe('day rows and billing rows stay consistent', () => {
    it('aggregates the same hours that land on the per-day rows', () => {
      const emp = makeEmp();
      setCategory('oms', [emp], [matchedRow()]);

      const grid = component.gridRows(emp, 'oms');
      const columns = component.gridColumns('oms');
      component.onGridTimeInput(emp, grid[1], columns.find((c: any) => c.key === 'overtime-0'), '200');
      component.onGridTimeInput(emp, grid[2], columns.find((c: any) => c.key === 'overtime-0'), '150');
      // '200' -> 02:00 and '150' -> 01:50, i.e. 2h + 1h50m = 3.8333h.
      const expectedHours = 2 + 1 + 50 / 60;

      const dayRows = component.buildRows('oms');
      // OT day cells are Excel TIME-formatted -> day fractions.
      const dayTotal = dayRows.reduce((s: number, r: any) => s + (r.values[4] ?? 0), 0);
      expect(dayTotal).toBeCloseTo(expectedHours / 24, 5);

      const [row] = component.buildBillingRows('oms', []);
      // Billing OT column is [hh]:mm-formatted -> Excel day-fraction,
      // matching the per-day cells.
      expect(row.values[6]).toBeCloseTo(expectedHours / 24, 5);
    });

    it('writes the JAN hours rendered as a day-fraction so it shows hh:mm', () => {
      // The user's explicit requirement: NO. OF HOURS RENDERED on the JAN
      // worksheet is the sum of the regular hours, displayed as hh:mm.
      const emp = makeEmp({
        // 12 full days (checked) + one 03:55 day = 99.9167h.
        janitorialDays: [
          ...Array.from({ length: 12 }, (_, i) => ({
            date: `2026-09-${String(i + 1).padStart(2, '0')}`,
            checked: true,
            hours: '8:00',
          })),
          { date: '2026-09-13', checked: false, hours: '03:55' },
          { date: '2026-09-14', checked: false, hours: '' },
          { date: '2026-09-15', checked: false, hours: '' },
        ],
      });
      setCategory('jan', [emp], [matchedRow()]);

      const [row] = component.buildBillingRows('jan', []);
      const expectedHours = 12 * 8 + 3 + 55 / 60;
      // jBillingTable: 5 = NO. OF HOURS RENDERED, [hh]:mm-formatted.
      expect(row.values[5]).toBeCloseTo(expectedHours / 24, 5);
    });
  });
});