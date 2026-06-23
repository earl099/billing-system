/**
 * @fileoverview Date picker component with "d MMMM yyyy" format (e.g., "5 January 2026")
 * Used in billing letter editor for billing date fields
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';

/** Luxon date format configuration for "d MMMM yyyy" display */
export const DATE_MONTH_YEAR_FORMATS = {
  parse: {
    dateInput: 'd MMMM yyyy',
  },
  display: {
    dateInput: 'd MMMM yyyy',
    monthYearLabel: 'd MMMM yyyy',
    dateA11yLabel: 'd MMMM yyyy',
    monthYearA11yLabel: 'd MMMM yyyy',
  },
};

@Component({
  selector: 'app-date-month-year-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-form-field
      class="w-full">
      <mat-label>{{label}}</mat-label>
      <input
        matInput
        [matDatepicker]="picker"
        [formControl]="control"
        readonly>

      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>

      <mat-datepicker #picker>
      </mat-datepicker>
    </mat-form-field>

  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [provideLuxonDateAdapter(DATE_MONTH_YEAR_FORMATS)]
})
export class DateMonthYearPickerComponent {
  @Input({ required: true }) control!: any;
  @Input({ required: true }) label!: string
}
