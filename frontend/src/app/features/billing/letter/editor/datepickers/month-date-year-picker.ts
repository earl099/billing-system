import { Component, Input, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon';

export const MONTH_DATE_YEAR_FORMATS = {
  parse: {
    dateInput: 'MMMM dd yyyy',
  },
  display: {
    dateInput: 'MMMM dd, yyyy',
    monthYearLabel: 'MMMM dd, yyyy',
    dateA11yLabel: 'MMMM dd, yyyy',
    monthYearA11yLabel: 'MMMM dd, yyyy',
  },
};

@Component({
  selector: 'app-month-date-year-picker',
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
  providers: [provideLuxonDateAdapter(MONTH_DATE_YEAR_FORMATS)]
})
export class MonthDateYearPickerComponent {
  @Input({ required: true }) control!: any;
  @Input({ required: true }) label!: string
}
