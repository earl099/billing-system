import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Manpower } from '@services/manpower';
import { Create } from './create';

describe('Create employee form', () => {
  let fixture: ComponentFixture<Create>;
  const manpower = { addToTable: vi.fn(async () => undefined) };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Create],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ code: 'BTR' }) } },
        },
        { provide: Manpower, useValue: manpower },
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
  });

  it('does not submit an incomplete employee form', async () => {
    await fixture.componentInstance.ngOnInit();

    await fixture.componentInstance.addData();

    expect(manpower.addToTable).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls['empNo'].touched).toBe(true);
  });
});
