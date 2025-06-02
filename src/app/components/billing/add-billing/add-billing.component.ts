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


  //timekeeping
  activeTabTK: 'file' | 'home' = 'home';
  showColorDropdownTK = false;
  fontFamilyTK = 'Segoe UI';
  fontColorTK = '#000000';
  fontSizeTK = 11;
  fontListTK = [
    'Segoe UI', 'Arial', 'Calibri', 'Courier New', 'Georgia',
    'Times New Roman', 'Verdana', 'Tahoma'
  ];
  fontSizesTK = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  presetColorsTK = ['#000000', '#FF0000', '#008000', '#0000FF', '#FFA500']; // black, red, green, blue, orange

  //billing rate
  activeTabBR: 'file' | 'home' = 'home';
  showColorDropdownBR = false;
  fontFamilyBR = 'Segoe UI';
  fontColorBR = '#000000';
  fontSizeBR = 11;
  fontListBR = [
    'Segoe UI', 'Arial', 'Calibri', 'Courier New', 'Georgia',
    'Times New Roman', 'Verdana', 'Tahoma'
  ];
  fontSizesBR = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  presetColorsBR = ['#000000', '#FF0000', '#008000', '#0000FF', '#FFA500']; // black, red, green, blue, orange


  initialRows = 10;
  initialCols = 10;

  rowCount = this.initialRows;
  colCount = this.initialCols;

  hostStyle = {
    width: '100%',
    height: '520px'
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
      this.toastr.success('Successfully Created New File!');
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
    this.initialRows = 10;
    this.initialCols = 10;
    this.rowCount = 10;
    this.colCount = 10;
    this.filename = 'NewSpreadsheet';

    this.cdr.detectChanges();
  }

  async saveNewBlankSpreadsheet() {
  if (!this.isNewBlankInitialized || !this.newBlankSpread) return;

  const name = this.filename?.trim() || 'NewSpreadsheet';
  const fileName = name.endsWith('.xlsx') ? name : `${name}.xlsx`;

  if ('showSaveFilePicker' in window) {
    try {
      // Show native file save picker
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Excel Files',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
          }
        ]
      });

      const writable = await handle.createWritable();

      // Save workbook to blob and write to file
      this.newBlankSpread.save(async (blob: Blob) => {
        await writable.write(blob);
        await writable.close();
        this.toastr.success(`Successfully saved "${fileName}"!`);
      }, (error: any) => {
        this.toastr.error(`Failed to save "${fileName}".`);
        console.error('Save error:', error);
      }, { fileType: GC.Spread.Sheets.FileType.excel });

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        this.toastr.error('Save operation failed.');
        console.error('Save error:', err);
      }
    }
  } else {
    // Fallback for browsers without File System Access API
    this.newBlankSpread.save((blob: Blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toastr.success(`Successfully saved "${fileName}"!`);
    }, (error: any) => {
      this.toastr.error(`Failed to save "${fileName}".`);
      console.error('Save error:', error);
    }, { fileType: GC.Spread.Sheets.FileType.excel });
  }
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



  // Ribbon Functions for Timekeeping Only
  applyFontTK() {
    const sheet = this.timekeepSpread?.getActiveSheet();
    if (!sheet) return;

    const selection = sheet.getSelections()[0];
    if (!selection) return;

    for (let r = selection.row; r < selection.row + selection.rowCount; r++) {
      for (let c = selection.col; c < selection.col + selection.colCount; c++) {
        const style = new GC.Spread.Sheets.Style();
        style.font = `${this.fontSizeTK}px ${this.fontFamilyTK}`;
        style.foreColor = this.fontColorTK;
        sheet.setStyle(r, c, style, GC.Spread.Sheets.SheetArea.viewport);
      }
    }
    sheet.repaint();
  }

  // Set Font Color and Apply
  setFontColorTK(color: string) {
    this.fontColorTK = color;
    this.applyFontTK();
    this.showColorDropdownTK = false;
  }

  // Toggle Dropdown Visibility
  toggleColorDropdownTK() {
    this.showColorDropdownTK = !this.showColorDropdownTK;
  }

  // Toggle Font Weight Utility
  toggleFontWeightTK(parts: string[], value: string): string {
    const exists = parts.includes(value);
    return exists ? parts.filter(p => p !== value).join(' ') : [value, ...parts].join(' ');
  }

  // Toggle Bold, Italic, Underline Style
  toggleStyleTK(type: 'bold' | 'italic' | 'underline') {
    const sheet = this.timekeepSpread?.getActiveSheet();
    if (!sheet) return;

    const sel = sheet.getSelections()[0];
    if (!sel) return;

    for (let r = sel.row; r < sel.row + sel.rowCount; r++) {
      for (let c = sel.col; c < sel.col + sel.colCount; c++) {
        const current = sheet.getStyle(r, c) || new GC.Spread.Sheets.Style();
        let currentFont = current.font || `${this.fontSizeTK}px ${this.fontFamilyTK}`;
        const parts = currentFont.split(' ');

        if (type === 'bold') current.font = this.toggleFontWeightTK(parts, 'bold');
        else if (type === 'italic') current.font = this.toggleFontWeightTK(parts, 'italic');
        else if (type === 'underline') current.fontUnderline = !current.fontUnderline;

        sheet.setStyle(r, c, current, GC.Spread.Sheets.SheetArea.viewport);
      }
    }
    sheet.repaint();
  }

  // Apply Upper/Lower Case
  applyCaseTK(caseType: 'upper' | 'lower') {
    const sheet = this.timekeepSpread?.getActiveSheet();
    if (!sheet) return;

    sheet.getSelections().forEach((sel: { row: number; col: number }) => {
      const value = sheet.getValue(sel.row, sel.col);
      if (typeof value === 'string') {
        sheet.setValue(sel.row, sel.col, caseType === 'upper' ? value.toUpperCase() : value.toLowerCase());
      }
    });
  }


  // Ribbon Functions for Billing Rate Only
  applyFontBR() {
    const sheet = this.billingSpread?.getActiveSheet();
    if (!sheet) return;

    const selection = sheet.getSelections()[0];
    if (!selection) return;

    for (let r = selection.row; r < selection.row + selection.rowCount; r++) {
      for (let c = selection.col; c < selection.col + selection.colCount; c++) {
        const style = new GC.Spread.Sheets.Style();
        style.font = `${this.fontSizeBR}px ${this.fontFamilyBR}`;
        style.foreColor = this.fontColorBR;
        sheet.setStyle(r, c, style, GC.Spread.Sheets.SheetArea.viewport);
      }
    }
    sheet.repaint();
  }

  // Set Font Color and Apply
  setFontColorBR(color: string) {
    this.fontColorBR = color;
    this.applyFontBR();
    this.showColorDropdownBR = false;
  }

  // Toggle Dropdown Visibility
  toggleColorDropdownBR() {
    this.showColorDropdownBR = !this.showColorDropdownBR;
  }

  // Toggle Font Weight Utility
  toggleFontWeightBR(parts: string[], value: string): string {
    const exists = parts.includes(value);
    return exists ? parts.filter(p => p !== value).join(' ') : [value, ...parts].join(' ');
  }

  // Toggle Bold, Italic, Underline Style
  toggleStyleBR(type: 'bold' | 'italic' | 'underline') {
    const sheet = this.billingSpread?.getActiveSheet();
    if (!sheet) return;

    const sel = sheet.getSelections()[0];
    if (!sel) return;

    for (let r = sel.row; r < sel.row + sel.rowCount; r++) {
      for (let c = sel.col; c < sel.col + sel.colCount; c++) {
        const current = sheet.getStyle(r, c) || new GC.Spread.Sheets.Style();
        let currentFont = current.font || `${this.fontSizeBR}px ${this.fontFamilyBR}`;
        const parts = currentFont.split(' ');

        if (type === 'bold') current.font = this.toggleFontWeightBR(parts, 'bold');
        else if (type === 'italic') current.font = this.toggleFontWeightBR(parts, 'italic');
        else if (type === 'underline') current.fontUnderline = !current.fontUnderline;

        sheet.setStyle(r, c, current, GC.Spread.Sheets.SheetArea.viewport);
      }
    }
    sheet.repaint();
  }

  // Apply Upper/Lower Case
  applyCaseBR(caseType: 'upper' | 'lower') {
    const sheet = this.billingSpread?.getActiveSheet();
    if (!sheet) return;

    sheet.getSelections().forEach((sel: { row: number; col: number }) => {
      const value = sheet.getValue(sel.row, sel.col);
      if (typeof value === 'string') {
        sheet.setValue(sel.row, sel.col, caseType === 'upper' ? value.toUpperCase() : value.toLowerCase());
      }
    });
  }


  // Close active spreadsheet //
  closeActiveSpreadsheet() {
    if (this.showTimekeepSpreadsheet) this.toggleTimekeep();
    if (this.showBillingSpreadsheet) this.toggleBilling();
    if (this.showNewBlankSpreadsheet) this.closeNewBlankSpreadsheet();
  }

  // Save
  saveActiveSpreadsheet() {
    if ('showSaveFilePicker' in window) {
      if (this.showNewBlankSpreadsheet) {
        this.saveWithFileSystemAccess(this.newBlankSpread, this.filename || 'NewSpreadsheet.xlsx');
      } else if (this.showTimekeepSpreadsheet && this.timekeepFile) {
        this.saveWithFileSystemAccess(this.timekeepSpread, this.timekeepFile.name);
      } else if (this.showBillingSpreadsheet && this.billingFile) {
        this.saveWithFileSystemAccess(this.billingSpread, this.billingFile.name);
      } else {
        this.toastr.info('No spreadsheet is open for saving.');
      }
    } else {
      this.toastr.warning('Your browser does not support direct file saving. Download will be used instead.');
      this.saveNewBlankSpreadsheet(); // fallback for blank spreadsheet only
    }
  }


  async saveWithFileSystemAccess(spread: any, defaultFileName: string) {
    try {
      // Show file save picker
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          {
            description: 'Excel Files',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
          }
        ]
      });

      const writable = await handle.createWritable();

      // Save to blob and write to file
      spread.save(async (blob: Blob) => {
        await writable.write(blob);
        await writable.close();
        this.toastr.success(`Successfully saved file!`);

      }, (error: any) => {
        this.toastr.error(`Failed to save file!`);
        console.error('Save error:', error);
      }, { fileType: GC.Spread.Sheets.FileType.excel });

    } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      this.toastr.error('Save operation failed.');
      console.error('Save error:', err);
    }
  }

  }

  // Get active sheet
  getActiveSheet() {
    if (this.showTimekeepSpreadsheet && this.timekeepSpread) return this.timekeepSpread.getActiveSheet();
    if (this.showBillingSpreadsheet && this.billingSpread) return this.billingSpread.getActiveSheet();
    if (this.showNewBlankSpreadsheet && this.newBlankSpread) return this.newBlankSpread.getActiveSheet();
    return null;
  }


  // Row/Column Functions //
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
