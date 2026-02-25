import { Component, Input, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateTime } from 'luxon';

export const MONTH_YEAR_FORMATS = {
  parse: {
    dateInput: 'MMMM',
  },
  display: {
    dateInput: 'MMMM',
    monthYearLabel: 'MMMM',
    dateA11yLabel: 'MMMM',
    monthYearA11yLabel: 'MMMM',
  },
};

@Component({
  selector: 'app-month-picker',
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

      <mat-datepicker
        #picker
        startView="month"
        (monthSelected)="setMonthAndYear($event, picker)">
      </mat-datepicker>
    </mat-form-field>

  `,
  providers: [provideLuxonDateAdapter(MONTH_YEAR_FORMATS)]
})
export class MonthPickerComponent {
  @Input({ required: true }) control!: any;
  @Input({ required: true }) label!: string

  setMonthAndYear(
    normalizedMonthAndYear: DateTime,
    datepicker: MatDatepicker<DateTime>
  ) {
    const dt = DateTime.fromObject({ month: normalizedMonthAndYear.month });

    this.control.setValue(dt);
    datepicker.close();
  }
}
