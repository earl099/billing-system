import { Component, Input, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon';

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
  providers: [provideLuxonDateAdapter(DATE_MONTH_YEAR_FORMATS)]
})
export class DateMonthYearPickerComponent {
  @Input({ required: true }) control!: any;
  @Input({ required: true }) label!: string
}
