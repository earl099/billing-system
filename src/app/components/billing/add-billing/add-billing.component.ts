import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { SpreadSheetsModule } from '@mescius/spread-sheets-angular';
import { MatIconModule } from '@angular/material/icon';

import * as GC from "@mescius/spread-sheets";
import '@mescius/spread-sheets-angular';
import '@mescius/spread-sheets-io';
import '@mescius/spread-sheets-charts';
import '@mescius/spread-sheets-shapes';

@Component({
  selector: 'app-add-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatCardModule,
    MatTableModule,
    SpreadSheetsModule,
    MatIconModule,
  ],
  templateUrl: './add-billing.component.html',
  styleUrl: './add-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBillingComponent implements OnInit {
  toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);

  timekeepFile: File | null = null;
  billingFile: File | null = null;
  blankspreadsheetFile: File | null = null;

  private timekeepSpread: any;
  private billingSpread: any;
  private newBlankSpread: any;

  private isTimekeepWbInitialized = false;
  private isBillingWbInitialized = false;
  private isNewBlankInitialized = false;

  showTimekeepSpreadsheet = false;
  showBillingSpreadsheet = false;
  showNewBlankSpreadsheet = false;
  showSettings = false;
  showSettingsPopup = false;

  filename = 'NewSpreadsheet';


  initialRows = 10;
  initialCols = 10;

  rowCount = this.initialRows;
  colCount = this.initialCols;


  hostStyle = {
    width: '95%',
    height: '600px'
  };


  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput1') fileInput1Ref!: ElementRef<HTMLInputElement>;

  constructor() {
    this.timekeepSpread = new GC.Spread.Sheets.Workbook();
    this.billingSpread = new GC.Spread.Sheets.Workbook();
    this.newBlankSpread = new GC.Spread.Sheets.Workbook();
  }

  ngOnInit(): void {}

  timekeepWbInit(event: any) {
    this.timekeepSpread = event.spread;
    this.isTimekeepWbInitialized = true;
    if (this.timekeepFile) this.importTimekeeping(this.timekeepFile);
  }

  billingWbInit(event: any) {
    this.billingSpread = event.spread;
    this.isBillingWbInitialized = true;
    if (this.billingFile) this.importBilling(this.billingFile);
  }

  newBlankWbInit(event: any) {
    this.newBlankSpread = event.spread;
    this.isNewBlankInitialized = true;

    // Set initial row/col size
    const sheet = this.newBlankSpread.getActiveSheet();
    sheet.setRowCount(this.initialRows);
    sheet.setColumnCount(this.initialCols);
  }

  onTKFileChange(e: any) {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.timekeepFile = file;
      this.toastr.success('Timekeeping file selected!');
    } else {
      this.toastr.error('Invalid file type. Please upload an .xlsx file.');
    }
  }

  onBRChange(e: any) {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.billingFile = file;
      this.toastr.success('Billing file selected!');
    } else {
      this.toastr.error('Invalid file type. Please upload an .xlsx file.');
    }
  }

  toggleTimekeep() {
    if (this.showTimekeepSpreadsheet) {
      this.showTimekeepSpreadsheet = false;
      this.timekeepFile = null;
      if (this.fileInputRef?.nativeElement) {
        this.fileInputRef.nativeElement.value = '';
        this.timekeepSpread.clearSheets();
      }
    } else {
      if (!this.timekeepFile) return;
      this.showTimekeepSpreadsheet = true;
      if (this.isTimekeepWbInitialized) {
        this.importTimekeeping(this.timekeepFile);
      }
    }
    this.cdr.detectChanges();
  }

  toggleBilling() {
    if (this.showBillingSpreadsheet) {
      this.showBillingSpreadsheet = false;
      this.billingFile = null;
      if (this.fileInput1Ref?.nativeElement) {
        this.fileInput1Ref.nativeElement.value = '';
      }
    } else {
      if (!this.billingFile) return;
      this.showBillingSpreadsheet = true;
      if (this.isBillingWbInitialized) {
        this.importBilling(this.billingFile);
      }
    }
    this.cdr.detectChanges();
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  openSettingsPopup() {
    this.showSettingsPopup = true;
  }

  closeSettingsPopup() {
    this.showSettingsPopup = false;
  }

  confirmCreateSpreadsheet() {
    this.showSettingsPopup = false;
    this.rowCount = this.initialRows;
    this.colCount = this.initialCols;
    this.createNewBlankSpreadsheet();
  }

  createNewBlankSpreadsheet() {
    this.showNewBlankSpreadsheet = true;
    this.blankspreadsheetFile = null;
    this.cdr.detectChanges();

    if (this.isNewBlankInitialized) {
      const sheet = this.newBlankSpread.getActiveSheet();
      sheet.setRowCount(this.initialRows);
      sheet.setColumnCount(this.initialCols);
      this.toastr.success('Successfully Created New File!')
    }
  }

  closeNewBlankSpreadsheet() {
    this.showNewBlankSpreadsheet = false;

    if (this.isNewBlankInitialized && this.newBlankSpread) {
      const sheet = this.newBlankSpread.getActiveSheet();
      sheet.clear(0, 0, sheet.getRowCount(), sheet.getColumnCount(), GC.Spread.Sheets.SheetArea.viewport);
      sheet.setRowCount(this.initialRows);
      sheet.setColumnCount(this.initialCols);
    }
    // Reset to default state
    this.initialRows = 5;
    this.initialCols = 5;
    this.rowCount = 5;
    this.colCount = 5;
    this.filename = 'NewSpreadsheet'; //Reset file name

    this.cdr.detectChanges();
  }

  saveNewBlankSpreadsheet() {
    if (!this.isNewBlankInitialized || !this.newBlankSpread) return;

    const name = this.filename?.trim() || 'NewSpreadsheet';
    const fileName = name.endsWith('.xlsx') ? name : `${name}.xlsx`;

    this.newBlankSpread.save((blob: Blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toastr.success('Successfully saved File!');
    }, (error: any) => {
      this.toastr.error('Failed to save spreadsheet');
      console.error('Save error:', error);
    }, { fileType: GC.Spread.Sheets.FileType.excel });
  }


  private importTimekeeping(file: File) {
    this.timekeepSpread.import(file, () => this.cdr.detectChanges());
  }

  private importBilling(file: File) {
    this.billingSpread.import(file, () => this.cdr.detectChanges());
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  // Row/Column Functions
    addRow() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      const rowCount = sheet.getRowCount();
      sheet.addRows(rowCount, 1);
      this.rowCount = sheet.getRowCount();
    }

    deleteRow() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      const rowCount = sheet.getRowCount();
      if (rowCount > 1) sheet.deleteRows(rowCount - 1, 1);
      this.rowCount = sheet.getRowCount();
    }

    addColumn() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      const colCount = sheet.getColumnCount();
      sheet.addColumns(colCount, 1);
      this.colCount = sheet.getColumnCount();
    }

    deleteColumn() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      const colCount = sheet.getColumnCount();
      if (colCount > 1) sheet.deleteColumns(colCount - 1, 1);
      this.colCount = sheet.getColumnCount();
    }

    updateRowCount() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      sheet.setRowCount(this.rowCount);
    }

    updateColCount() {
      if (!this.isNewBlankInitialized) return;
      const sheet = this.newBlankSpread.getActiveSheet();
      sheet.setColumnCount(this.colCount);
    }
  }
