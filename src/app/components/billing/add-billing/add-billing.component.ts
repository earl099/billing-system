import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
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

  constructor() {
    this.timekeepSpread = new GC.Spread.Sheets.Workbook()
    this.billingSpread = new GC.Spread.Sheets.Workbook()
  }
  ngOnInit(): void { }

  timekeepWbInit($event: any) {
    this.timekeepSpread = $event.spread
  }

  onTKFileChange(e: any) {
    this.selectedTk = e.target.files[0]
  }

  openTk() {
    let file = this.selectedTk

    if(!file) {
      return
    }

    const options: GC.Spread.Sheets.ImportOptions = {
      fileType: GC.Spread.Sheets.FileType.excel
    }

    this.timekeepSpread.import(file, () => {
      console.log('Import Successful!')
    }, (e: any) => {
      console.error('Error during import: ', e)
    }, options)
  }

  billingWbInit($event: any) {
    this.billingSpread = $event.spread
  }

  onBRChange(event: any) {
    const file: File = event.target.files[0]
    this.billingFile = file
  }

  openBRate() {
    let file = this.selectedBilling

    if(!file) {
      return
    }

    const options: GC.Spread.Sheets.ImportOptions = {
      fileType: GC.Spread.Sheets.FileType.excel
    }

    this.billingSpread.import(file, () => {
      console.log('Import Successful!')
    }, (e: any) => {
      console.error('Error during import: ', e)
    }, options)
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click()
  }
}
