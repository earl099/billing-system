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
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
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
  fontList = ['Arial', 'Calibri', 'TimesNewRoman', 'Verdana', 'Georgia'];
  selectedFont = 'Arial';
  selectedFontSize = 11;
  selectedBorderStyle: string = 'none';

  borderOptions = [
    { value: 'bottom',            label: 'Bottom Border' },
    { value: 'top',               label: 'Top Border' },
    { value: 'left',              label: 'Left Border' },
    { value: 'right',             label: 'Right Border' },
    { value: 'none',              label: 'No Border' },
    { value: 'all',               label: 'All Borders' },
    { value: 'outside',           label: 'Outside Borders' },
    { value: 'thickOutside',      label: 'Thick Outside Borders' },
    { value: 'bottomDouble',      label: 'Bottom Double Border' },
    { value: 'thickBottom',       label: 'Thick Bottom Border' },
    { value: 'topAndBottom',      label: 'Top and Bottom Border' },
    { value: 'topAndThickBottom', label: 'Top and Thick Bottom Border' },
    { value: 'topAndDoubleBottom',label: 'Top and Double Bottom Border' },
  ];

  colorPalette: string[] = [
    'Black', 'White', 'Red', 'Green', 'Blue',
    'Yellow', 'Magenta', 'Cyan', 'Gray', 'Orange'
  ];

  selectedFillColor: string = '#000000';
  selectedFontColor: string = '#000000';
  initialRows = 10;
  initialCols = 10;
  isBold = false;
  isItalic = false;
  isUnderline = false;
  isDoubleUnderline = false;

  activeTab: 'home' | 'insert' = 'home';

  fontSizes: number[] = [
    8, 9, 10, 11, 12, 14, 16, 18, 20,
    24, 26, 28, 36, 48, 72
  ];

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

    // Bind to selection changed to sync UI controls
    this.newBlankSpread.bind(
    GC.Spread.Sheets.Events.SelectionChanged,
    (e: GC.Spread.Sheets.Workbook, args: GC.Spread.Sheets.ISelectionChangedEventArgs) => {
      const sheet = this.newBlankSpread.getActiveSheet();
      const row = sheet.getActiveRowIndex();
      const col = sheet.getActiveColumnIndex();

      if (row >= 0 && col >= 0) {
        const cell = sheet.getCell(row, col);

        // Parse font string
        const fontStr = cell.font(); // e.g., "italic bold 11pt Arial"
        if (fontStr) {
          const match = fontStr.match(/(\bitalic\b)?\s*(\bbold\b)?\s*(\d+)pt\s+(.+)/i);
          if (match) {
            const [, italic, bold, size, font] = match;
            this.selectedFontSize = parseInt(size);
            this.selectedFont = font.trim();
            this.isBold = !!bold;
            this.isItalic = !!italic;
          } else {
            // Fallbacks
            this.selectedFontSize = 11;
            this.selectedFont = 'Arial';
            this.isBold = false;
            this.isItalic = false;
          }
        }

        // Text decoration
        const deco = cell.textDecoration();
        this.isUnderline = deco === GC.Spread.Sheets.TextDecorationType.underline;
        this.isDoubleUnderline = deco === (GC.Spread.Sheets.TextDecorationType as any).doubleUnderline;

        // Font color and fill color
        const foreColor = cell.foreColor();
        const backColor = cell.backColor();

        this.selectedFontColor = foreColor || '#000000';
        this.selectedFillColor = backColor || '#FFFFFF';
      }
      this.cdr.detectChanges();
    });
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
    this.initialRows = 10;
    this.initialCols = 10;
    this.rowCount = 10;
    this.colCount = 10;
    this.filename = 'NewSpreadsheet';
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

  changeFont() {
  this.applyFontStyles();
  }

  changeFontSize() {
    this.applyFontStyles();
  }

  applyBorderStyle(style?: string) {
    if (style) {
      this.selectedBorderStyle = style;
    }
    if (!this.newBlankSpread) return;
    const sheet = this.newBlankSpread.getActiveSheet();
    const sels  = sheet.getSelections() as GC.Spread.Sheets.Range[];

    const LB = GC.Spread.Sheets.LineBorder;
    const LS = GC.Spread.Sheets.LineStyle;
    const thin      = new LB('black', LS.thin);
    const thick     = new LB('black', LS.thick);
    const dblBottom = new LB('black', LS.double);

    const clearAll = (r: number, c: number) => {
      const cell = sheet.getCell(r, c);
      cell.borderTop(null);
      cell.borderBottom(null);
      cell.borderLeft(null);
      cell.borderRight(null);
    };

    const forEachCell = (fn: (r: number, c: number) => void) => {
      if (!sels || sels.length === 0) {
        const r = sheet.getActiveRowIndex();
        const c = sheet.getActiveColumnIndex();
        if (r >= 0 && c >= 0) fn(r, c);
      } else {
        sels.forEach(rng => {
          const startR = rng.row,      endR = rng.row + rng.rowCount - 1;
          const startC = rng.col,      endC = rng.col + rng.colCount - 1;
          for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
              fn(r, c);
            }
          }
        });
      }
    };

    forEachCell(clearAll);

    switch (this.selectedBorderStyle) {
      case 'bottom':
        forEachCell((r,c) => sheet.getCell(r,c).borderBottom(thin));
        break;

      case 'top':
        forEachCell((r,c) => sheet.getCell(r,c).borderTop(thin));
        break;

      case 'left':
        forEachCell((r,c) => sheet.getCell(r,c).borderLeft(thin));
        break;

      case 'right':
        forEachCell((r,c) => sheet.getCell(r,c).borderRight(thin));
        break;

      case 'all':
        forEachCell((r,c) => {
          const cell = sheet.getCell(r,c);
          cell.borderTop(thin);
          cell.borderBottom(thin);
          cell.borderLeft(thin);
          cell.borderRight(thin);
        });
        break;

      case 'outside':
        forEachCell((r,c) => {
          const rng = sels[0];
          const startR = rng.row, endR = rng.row + rng.rowCount - 1;
          const startC = rng.col, endC = rng.col + rng.colCount - 1;
          const cell = sheet.getCell(r,c);
          if (r === startR) cell.borderTop(thin);
          if (r === endR)   cell.borderBottom(thin);
          if (c === startC) cell.borderLeft(thin);
          if (c === endC)   cell.borderRight(thin);
        });
        break;

      case 'thickOutside':
        forEachCell((r,c) => {
          const rng = sels[0];
          const startR = rng.row, endR = rng.row + rng.rowCount - 1;
          const startC = rng.col, endC = rng.col + rng.colCount - 1;
          const cell = sheet.getCell(r,c);
          if (r === startR) cell.borderTop(thick);
          if (r === endR)   cell.borderBottom(thick);
          if (c === startC) cell.borderLeft(thick);
          if (c === endC)   cell.borderRight(thick);
        });
        break;

      case 'bottomDouble':
        forEachCell((r,c) => sheet.getCell(r,c).borderBottom(dblBottom));
        break;

      case 'thickBottom':
        forEachCell((r,c) => sheet.getCell(r,c).borderBottom(thick));
        break;

      case 'topAndBottom':
        forEachCell((r,c) => {
          const cell = sheet.getCell(r,c);
          cell.borderTop(thin);
          cell.borderBottom(thin);
        });
        break;

      case 'topAndThickBottom':
        forEachCell((r,c) => {
          const cell = sheet.getCell(r,c);
          cell.borderTop(thin);
          cell.borderBottom(thick);
        });
        break;

      case 'topAndDoubleBottom':
        forEachCell((r,c) => {
          const cell = sheet.getCell(r,c);
          cell.borderTop(thin);
          cell.borderBottom(dblBottom);
        });
        break;
    }
  }

  applySelectedFillColor() {
    this.selectFillColor(this.selectedFillColor);
  }
  selectFillColor(color: string) {
    this.selectedFillColor = color;
    this.applyFillColor();
  }

  applySelectedFontColor() {
    this.selectFontColor(this.selectedFontColor);
  }
  selectFontColor(color: string) {
    this.selectedFontColor = color;
    this.applyFontColor();
  }

  applyFillColor() {
    if (!this.newBlankSpread) return;
    const sheet = this.newBlankSpread.getActiveSheet();
    const sels = sheet.getSelections();

    const applyFill = (r: number, c: number) => {
      sheet.getCell(r, c).backColor(this.selectedFillColor);
    };

    if (!sels || sels.length === 0) {
      const r = sheet.getActiveRowIndex();
      const c = sheet.getActiveColumnIndex();
      if (r >= 0 && c >= 0) applyFill(r, c);
    } else {
      sels.forEach((range: GC.Spread.Sheets.Range) => {
        for(let r = range.row; r < range.row + range.rowCount; r++) {
          for(let c = range.col; c < range.col + range.colCount; c++) {
            applyFill(r, c);
          }
        }
      });
    }
  }

  applyFontColor() {
    if (!this.newBlankSpread) return;
    const sheet = this.newBlankSpread.getActiveSheet();
    const sels = sheet.getSelections();

    const applyFontCol = (r: number, c: number) => {
      sheet.getCell(r, c).foreColor(this.selectedFontColor);
    };

    if (!sels || sels.length === 0) {
      const r = sheet.getActiveRowIndex();
      const c = sheet.getActiveColumnIndex();
      if (r >= 0 && c >= 0) applyFontCol(r, c);
    } else {
      sels.forEach((range: GC.Spread.Sheets.Range) => {
        for(let r = range.row; r < range.row + range.rowCount; r++) {
          for(let c = range.col; c < range.col + range.colCount; c++) {
            applyFontCol(r, c);
          }
        }
      });
    }
  }

    increaseFontSize() {
      const idx = this.fontSizes.indexOf(this.selectedFontSize);
      if (idx >= 0 && idx < this.fontSizes.length - 1) {
        this.selectedFontSize = this.fontSizes[idx + 1];
        this.applyFontStyles();
      }
    }


    decreaseFontSize() {
      const idx = this.fontSizes.indexOf(this.selectedFontSize);
      if (idx > 0) {
        this.selectedFontSize = this.fontSizes[idx - 1];
        this.applyFontStyles();
      }
    }

  // Helper method to apply font and size to selected cells or active cell
  applyFontToSelection(fontName: string, fontSize: number) {
    const sheet = this.newBlankSpread.getActiveSheet();
    const selections = sheet.getSelections();

    const safeFontName = fontName.includes(' ') ? `"${fontName}"` : fontName;
    const fontString = `${fontSize}pt ${safeFontName}`;

    if (!selections || selections.length === 0) {
      const row = sheet.getActiveRowIndex();
      const col = sheet.getActiveColumnIndex();
      if (row >= 0 && col >= 0) {
        sheet.getCell(row, col).font(fontString);
      }
    } else {
      selections.forEach((range: GC.Spread.Sheets.Range) => {
        for (let r = range.row; r < range.row + range.rowCount; r++) {
          for (let c = range.col; c < range.col + range.colCount; c++) {
            sheet.getCell(r, c).font(fontString);
          }
        }
      });
    }
  }

  applyFontStyles() {
    if (!this.newBlankSpread) return;
    const sheet = this.newBlankSpread.getActiveSheet();
    const sels = sheet.getSelections();

    const weight  = this.isBold   ? 'bold'   : '';
    const style   = this.isItalic ? 'italic' : '';
    const fontStr = `${style} ${weight} ${this.selectedFontSize}pt ${this.selectedFont}`
                      .trim()
                      .replace(/\s+/g,' ');

                      const TD = GC.Spread.Sheets.TextDecorationType;
    let deco = TD.none;
    if (this.isDoubleUnderline)      deco = (TD as any).doubleUnderline;
    else if (this.isUnderline)       deco = TD.underline;

    const applyCell = (r: number, c: number) => {
      const cell = sheet.getCell(r, c);
      cell.font(fontStr);
      cell.textDecoration(deco);
    };

    if (!sels || sels.length === 0) {
      const r = sheet.getActiveRowIndex();
      const c = sheet.getActiveColumnIndex();
      if (r >= 0 && c >= 0) applyCell(r, c);
    } else {
  sels.forEach((range: GC.Spread.Sheets.Range) => {
    for (let r = range.row; r < range.row + range.rowCount; r++) {
      for (let c = range.col; c < range.col + range.colCount; c++) {
        applyCell(r, c);
      }
        }
      });
    }
  }

  toggleBold() {
    this.isBold = !this.isBold;
    this.applyFontStyles();
  }

  toggleItalic() {
    this.isItalic = !this.isItalic;
    this.applyFontStyles();
  }

  toggleUnderline() {
    if (this.isDoubleUnderline) this.isDoubleUnderline = false;

    this.isUnderline = !this.isUnderline;
    this.applyFontStyles();
  }

  toggleDoubleUnderline() {
    if (this.isUnderline) this.isUnderline = false;

    this.isDoubleUnderline = !this.isDoubleUnderline;
    this.applyFontStyles();
  }
}
