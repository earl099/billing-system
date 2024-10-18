import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../services/auth.service';
import { PayFreqService } from '../../../../services/pay.freq.service';
import { LogsService } from '../../../../services/logs.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

//** PAY FREQUENCY LIST **//
@Component({
  selector: 'app-pay.freq.list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './pay.freq.list.component.html',
  styleUrl: './pay.freq.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayFreqListComponent implements OnInit {
  authService = inject(AuthService)
  logsService = inject(LogsService)
  payFreqService = inject(PayFreqService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  payFreqs: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['payType', 'actions']

  constructor() { }

  ngOnInit(): void {
    this.getPayFreqs()
  }

  getPayFreqs() {
    this.payFreqService.getPayFreqs().subscribe((res) => {
      if(res) {
        let tmpData = res.payFreqs

        this.dataSource = new MatTableDataSource(tmpData)
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort
      }
    })
  }

  openAddPayFreqDialog() {
    const dialogRef = this.dialog.open(AddPayFreqDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getPayFreqs()
    })
  }

  openViewPayFreqDialog(id: number) {
    const dialogRef = this.dialog.open(ViewPayFreqDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getPayFreqs()
    })
  }

  openEditPayFreqDialog(id: number) {
    const dialogRef = this.dialog.open(EditPayFreqDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getPayFreqs()
    })
  }

  delPayFreq(id: number) {
    if(confirm('Are you sure you want to delete this pay frequency?')) {
      let logData = {
        operation: 'Deleted Pay Frequency',
        user: this.authService.getToken('user')
      }

      this.payFreqService.delPayFreq(Number(id)).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe((res) => {
            if(res) {
              this.toastr.success('Pay Frequency deleted successfully')
              this.dataSource.data.splice(0, this.dataSource.data.length)
              this.getPayFreqs()
            }
          })

        }
      })
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
    this.dataSource.filter = filterValue.trim().toLowerCase()

    if(this.dataSource.paginator) {
      this.dataSource.paginator.firstPage()
    }
  }

  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
}

//** ADD PAY FREQ DIALOG **//
@Component({
  selector: 'add-pay-freq-dialog',
  templateUrl: './add.pay.freq.dialog.html',
  styleUrl: './pay.freq.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule
  ]
})
export class AddPayFreqDialog implements OnInit {
  addPayFreqForm: FormGroup

  payFreqService = inject(PayFreqService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  constructor(private fb: FormBuilder) {
    this.addPayFreqForm = this.fb.group({
      payType: ['', Validators.required]
    })
  }

  ngOnInit(): void { }

  onAddPayFreq(data: any) {
    if(confirm('Are you sure you want to add a pay frequency?')) {
      let logData = {
        operation: 'Added Pay Frequency',
        user: this.authService.getToken('user')
      }
      this.payFreqService.addPayFreq(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Pay Frequency added successfully.')
        }
      })
    }
  }
}

//** VIEW PAY FREQUENCY DIALOG **//
@Component({
  selector: 'view-pay-freq-dialog',
  templateUrl: './view.pay.freq.dialog.html',
  styleUrl: './pay.freq.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
  ]
})
export class ViewPayFreqDialog implements OnInit {
  payFreqService = inject(PayFreqService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  viewPayFreqForm: FormGroup
  payFreqId = this.data.id

  constructor() {
    this.viewPayFreqForm = this.fb.group({
      payType: ''
    })
  }
  ngOnInit(): void {
    this.getPayFreq(this.payFreqId)
  }

  getPayFreq(id: number) {
    this.payFreqService.getPayFreq(id).subscribe((res) => {
      if(res) {
        let tmpData = res.payFreq
        this.viewPayFreqForm.get('payType')?.setValue(tmpData.payType)
      }
    })
  }
}

//** EDIT PAY FREQUENCY DIALOG **//
@Component({
  selector: 'edit-pay-freq-dialog',
  templateUrl: './edit.pay.freq.dialog.html',
  styleUrl: './pay.freq.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule
  ]
})
export class EditPayFreqDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  editPayFreqForm: FormGroup
  payFreqId = this.data.id

  payFreqService = inject(PayFreqService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  constructor(private fb: FormBuilder) {
    this.editPayFreqForm = this.fb.group({
      payType: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.getPayFreq(this.payFreqId)
  }

  getPayFreq(id: number) {
    this.payFreqService.getPayFreq(id).subscribe((res) => {
      if(res) {
        let tmpData = res.payFreq
        this.editPayFreqForm.get('payType')?.setValue(tmpData.payType)

      }
    })
  }

  onEditPayFreq(data: any) {
    if(confirm('Are you sure you want to edit this pay frequency?')) {
      this.payFreqService.editPayFreq(this.payFreqId, data).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Pay Frequency',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()

          this.toastr.success('Edited Data Successfully.')
        }
      })
    }
  }
}

