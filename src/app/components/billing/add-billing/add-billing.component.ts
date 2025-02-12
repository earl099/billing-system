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
  toastr = inject(ToastrService)
  timekeepFile: File | null = null
  tkHeaderRow: number | null = null
  accrualFile: File | null = null
  aHeaderRow: number | null = null
  excelData: Array<any> = []
  constructor() { }
  ngOnInit(): void { }

  handleFileInput(event: any, mode: 'timekeep' | 'accrual'): void {
    const file: File = event.target.files[0]
    const filename = file.name.toLowerCase()
    if(file) {
      if(mode == 'timekeep') {
        if(filename.includes('timekeeping')) {
          this.timekeepFile = file
          this.readExcelFile(this.timekeepFile)
        }
        else {
          this.toastr.error('Must be a timekeeping file.')
        }
      }
      else if(mode == 'accrual') {
        if(filename.includes('accruals')) {
          this.accrualFile = file
          this.readExcelFile(this.accrualFile)
        }
        else {
          this.toastr.error('Must be an accrual file.')
        }

      }

    }
  }

  readExcelFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      let tmpData: Array<Array<any>> = []
      const data = e.target.result
      const workbook = XLSX.read(data, { type: 'array' })

      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false })

      for (let i = 0; i < this.excelData.length; i++) {
        for(let j = 0; j < this.excelData[i].length; j++) {
          try {
            if(this.excelData[i][j].includes('LB-')) {
              console.log(this.excelData[i])
            }
          } catch {
            continue
          }
        }
      }

    }
    reader.readAsArrayBuffer(file)
  }

  //under construction
  uploadFile() {
    if(this.timekeepFile) {
      const formData = new FormData()
      formData.append('file', this.timekeepFile)

    }
  }
}
