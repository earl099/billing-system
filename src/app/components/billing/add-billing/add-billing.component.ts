import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, type OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { SpreadSheetsModule } from '@mescius/spread-sheets-angular';

import * as GC from "@mescius/spread-sheets";
import '@mescius/spread-sheets-angular';
import '@mescius/spread-sheets-io';
import '@mescius/spread-sheets-charts';
import '@mescius/spread-sheets-shapes';

@Component({
  selector: 'app-add-billing',
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatCardModule,
    MatTableModule,
    ReactiveFormsModule,
    SpreadSheetsModule
  ],
  templateUrl: './add-billing.component.html',
  styleUrl: './add-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBillingComponent implements OnInit {

  timekeepFileUploaded: boolean = false;
  billingrateFileUploaded: boolean = false;
  private isTimekeepWbInitialized = false;
  private isBillingWbInitialized = false;


  toastr = inject(ToastrService)
  timekeepFile: File | null = null
  tkFileName: string = ''
  sheetNames: Array<any> = []
  billingFile: File | null = null
  excelData: Array<any> = []

  private timekeepSpread: any
  private billingSpread: any
  columnWidth = 100
  selectedTk: File | any = null
  selectedBilling: File | any = null

  hostStyle = {
    width: '95%',
    height: '600px'
  }

  constructor(private cdr: ChangeDetectorRef) {
    this.timekeepSpread = new GC.Spread.Sheets.Workbook()
    this.billingSpread = new GC.Spread.Sheets.Workbook()
  }

  ngOnInit(): void { }

  timekeepWbInit($event: any) {
    this.timekeepSpread = $event.spread;
    this.isTimekeepWbInitialized = true;
    if (this.timekeepFile) {
      this.importTimekeeping(this.timekeepFile);
    }
  }

  onTKFileChange(e: any) {
    this.timekeepFile = e.target.files[0] || null;
  }

  openTk() {
    if (!this.timekeepFile) {
      console.error('No timekeeping file selected!');
      return;
    }

    this.timekeepFileUploaded = true;
    this.cdr.detectChanges();

    if (this.isTimekeepWbInitialized) {
      this.importTimekeeping(this.timekeepFile);
    }
  }

  private importTimekeeping(file: File) {
    this.timekeepSpread.import(
      this.timekeepFile!,
      () => {

        this.timekeepFile = null;
        this.cdr.detectChanges();
      },
    );
  }

  billingWbInit($event: any) {
    this.billingSpread = $event.spread;
    this.isBillingWbInitialized = true;
    if (this.billingFile) {
      this.importBilling(this.billingFile);
    }
  }

  onBRChange(e: any) {
    this.billingFile = e.target.files[0] || null;
  }

  openBRate() {
    if (!this.billingFile) {
      console.error('No billing rate file selected!');
      return;
    }

    this.billingrateFileUploaded = true;
    this.cdr.detectChanges();

    if (this.isBillingWbInitialized) {
      this.importBilling(this.billingFile);
    }
  }

  private importBilling(file: File) {
    this.billingSpread.import(
      this.billingFile!,
      () => {

        this.billingFile = null;
        this.cdr.detectChanges();
      },
    );
  }


  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }
}
