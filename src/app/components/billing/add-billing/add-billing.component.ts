import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';

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
    ReactiveFormsModule
  ],
  templateUrl: './add-billing.component.html',
  styleUrl: './add-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBillingComponent implements OnInit {
  timekeepFile: File | null = null
  tkHeaderRow: number | null = null
  accrualFile: File | null = null
  aHeaderRow: number | null = null
  excelData: any
  constructor() { }
  ngOnInit(): void { }

  handleFileInput(event: any): void {
    const file: File = event.target.files[0]
    if(file) {
      this.timekeepFile = file
      this.readExcelFile(file)
    }
  }

  readExcelFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      const data = e.target.result
      const workbook = XLSX.read(data, { type: 'array' })

      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      this.excelData = XLSX.utils.sheet_to_json(worksheet, { range: 'A6:AD18' })
      console.log(this.excelData)
    }
    reader.readAsArrayBuffer(file)
  }

  uploadFile() {
    if(this.timekeepFile) {
      const formData = new FormData()
      formData.append('file', this.timekeepFile)

    }
  }
}
