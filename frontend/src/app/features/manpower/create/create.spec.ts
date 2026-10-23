import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { Manpower } from '@services/manpower';
import { FileEditor } from '@services/file-editor';
import { Rates } from '@services/rates';
import { Create } from './create';

describe('Create employee form', () => {
  let fixture: ComponentFixture<Create>;
  const columns = ['empNo', 'name', 'posCode', 'posName', 'calculatedTotal'];
  const positionRates = [
    { posCode: 'P-1', posName: 'Position One' },
    { posCode: 'P-2', posName: 'Position Two' },
  ];
  const manpower = {
    getColumns: vi.fn(async () => ({ columns, formulaColumns: ['CalculatedTotal'] })),
    addToTable: vi.fn(async () => undefined),
  };
  const fileEditor = {
    getTemplates: vi.fn(async () => [{ id: 'template-1', name: 'BTR.xlsm', type: 'excel' }]),
  };
  const rates = {
    list: vi.fn(async () => positionRates),
  };
  const router = { navigate: vi.fn(async () => true) };

  beforeEach(async () => {
    vi.clearAllMocks();
    manpower.getColumns.mockResolvedValue({ columns, formulaColumns: ['CalculatedTotal'] });
    fileEditor.getTemplates.mockResolvedValue([{ id: 'template-1', name: 'BTR.xlsm', type: 'excel' }]);
    rates.list.mockResolvedValue(positionRates);

    await TestBed.configureTestingModule({
      imports: [Create],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ code: 'BTR' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: Manpower, useValue: manpower },
        { provide: FileEditor, useValue: fileEditor },
        { provide: Rates, useValue: rates },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Create);
  });

  it('builds the BTR employee fields', async () => {
    await fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.code()).toBe('btr');
    expect(fixture.componentInstance.formConfig()).not.toHaveLength(0);
    expect(fixture.componentInstance.form.contains('empNo')).toBe(true);
    expect(fixture.componentInstance.form.contains('name')).toBe(true);
    expect(fixture.componentInstance.form.contains('posCode')).toBe(true);
    expect(fixture.componentInstance.form.contains('posName')).toBe(true);
    expect(fixture.componentInstance.form.contains('calculatedTotal')).toBe(false);
    expect(fixture.componentInstance.form.controls['posCode'].value).toBe('');
    expect(fixture.componentInstance.form.controls['posCode'].hasError('required')).toBe(true);
    expect(fixture.componentInstance.positions()).toEqual(positionRates);
    expect(fixture.componentInstance.tableColumns()).toEqual(columns);
  });

  it('loads position codes from the selected template PositionTable', async () => {
    await fixture.componentInstance.ngOnInit();

    expect(rates.list).toHaveBeenCalledWith('btr', 'BTR.xlsm');
    expect(fixture.componentInstance.formConfig().find((field) => field.key === 'posCode')?.type).toBe('select');
    expect(fixture.componentInstance.positions()).toEqual(positionRates);
  });

  it('shows only non-formula EmployeeTable columns for each billing template', async () => {
    const columns = [
      'Employee No.', 'Name', 'Position Code', 'Position Name', 'Department', 'Status', 'Type',
      'Pay Type', 'PayFrequency', 'Tax ID No.', 'SSS Number', 'PHIC Number', 'HDMF Number',
      'HD', 'MFopt|Amt', 'Salary|Wage', 'Bank Acct No.', 'Endorsed', 'Difference', 'DAILY', 'MONTHLY',
    ];
    const templates = [
      {
        name: 'BTr-BILLING-JANITORIAL-TEMPLATE.xlsm',
        formulas: ['Position Name', 'Endorsed', 'Difference', 'DAILY', 'MONTHLY'],
        includesName: true,
      },
      {
        name: 'BTr-BILLING-MISS-TEMPLATE.xlsm',
        formulas: ['Salary|Wage', 'Endorsed', 'Difference', 'DAILY', 'MONTHLY'],
        includesName: true,
      },
      {
        name: 'DOF-BILLING-TEMPLATE.xlsm',
        formulas: ['Name', 'Position Name', 'Department', 'Endorsed', 'Difference', 'DAILY', 'MONTHLY'],
        includesName: true,
      },
      {
        name: 'BILLING-TEMPLATE.xlsm',
        formulas: ['Position Name', 'Department', 'Endorsed', 'Difference', 'DAILY', 'MONTHLY'],
        includesName: true,
      },
    ];

    for (const template of templates) {
      fixture.componentInstance.code.set(template.name.startsWith('DOF-') ? 'dof' : 'btr');
      fixture.componentInstance.selectedTemplate.set({ name: template.name });
      manpower.getColumns.mockResolvedValueOnce({ columns, formulaColumns: template.formulas });

      await fixture.componentInstance.loadColumns();

      const formFields = fixture.componentInstance.formConfig();
      expect(formFields.map((field) => field.key)).toEqual(
        columns.filter((column) =>
          !template.formulas.includes(column) ||
          (template.name.startsWith('DOF-') && column === 'Name')
        ),
      );
      expect(formFields.some((field) => field.key === 'Name')).toBe(template.includesName);
      expect(formFields.some((field) =>
        template.formulas.includes(field.key) &&
        !(template.name.startsWith('DOF-') && field.key === 'Name')
      )).toBe(false);
      expect(formFields.find((field) => field.key === 'Employee No.')?.required).toBe(true);
    }
  });

  it('does not submit an incomplete employee form', async () => {
    await fixture.componentInstance.ngOnInit();

    await fixture.componentInstance.addData();

    expect(manpower.addToTable).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls['empNo'].touched).toBe(true);
  });

  it('submits the full table column order with only non-formula input values', async () => {
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.form.setValue({
      empNo: 'E-1',
      name: 'Employee',
      posCode: 'P-1',
      posName: '',
    });

    await fixture.componentInstance.addData();

    expect(manpower.addToTable).toHaveBeenCalledWith('btr', 'BTR.xlsm', 'EmployeeTable', {
      form: { empNo: 'E-1', name: 'Employee', posCode: 'P-1', posName: '' },
      columnMap: columns,
    });
  });

  it('does not build an editable form when formula-column metadata cannot be loaded', async () => {
    manpower.getColumns.mockRejectedValueOnce(new Error('Unavailable'));
    await fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.formConfig()).toHaveLength(0);
    expect(fixture.componentInstance.columnsError()).toBe('Unavailable');

    await fixture.componentInstance.addData();

    expect(manpower.addToTable).not.toHaveBeenCalled();
  });
});
