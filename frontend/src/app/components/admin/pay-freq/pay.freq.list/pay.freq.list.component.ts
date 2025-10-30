import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from "@angular/material/tooltip";
import { Log } from '@models/log';
import { PayFreq } from '@models/payFreq';
import { LogsService } from '@services/logs.service';
import { PayfreqService } from '@services/payfreq.service';
import { UserService } from '@services/user.service';
import { toast } from 'ngx-sonner';


@Component({
  selector: 'app-pay-freq-list',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltip
],
  templateUrl: './pay.freq.list.component.html',
  styleUrl: './pay.freq.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayFreqListComponent implements OnInit {
  //table data source
  dataSource!: MatTableDataSource<any>

  //pay freq list
  payFreqs: PayFreq[] = []

  //table columns
  columns: string[] = [
    'payType',
    'actions'
  ]

  //paginator and sort
  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  //services and modules needed for opening dialogs, adding logs and sorting
  logService = inject(LogsService)
  payFreqService = inject(PayfreqService)
  userService = inject(UserService)
  dialog = inject(MatDialog)

  ngOnInit(): void {
      this.getPayFreqs()
  }

  //function for initializing data
  getPayFreqs() {
    this.payFreqService.getPayFreqs().subscribe((res) => {
      let tmpData = res.payFreqs

      for(let i = 0; i < tmpData.length; i++) {
        this.payFreqs.push(tmpData[i])
      }
      console.log(this.payFreqs)
      this.dataSource = new MatTableDataSource(this.payFreqs)
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort
    })
  }

  openAddPayFreqDialog() {
    const dialogRef = this.dialog.open(AddPayFreqDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getPayFreqs()
    })
  }

  onDeletePayFreq(_id: string) {
    console.log(_id)
    if(confirm('Are you sure you want to delete this Pay frequency?')) {
      let logData: Log = {
        operation: 'Deleted Pay Frequency',
        user: this.userService.user()?.username ?? ''
      }

      this.payFreqService.deletePayFreq(_id).subscribe(() => {
        this.logService.addLog(logData).subscribe((res) => {
          if(res) {
            toast.success('Pay frequency deleted successfully.')
            this.dataSource.data.splice(0, this.dataSource.data.length)
            this.getPayFreqs()
          }
        })
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
      toast.info(`Sorted in ${sortState.direction} order`)
    } else {
      toast.info(`Sorting cleared`)
    }
  }
}

@Component({
  selector: 'add-payfreq-dialog',
  templateUrl: './pay.freq.add.dialog.html',
  styleUrl: './pay.freq.list.component.scss',
  imports: [
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ]
})
export class AddPayFreqDialog {
  addPayFreqForm: FormGroup

  payFreqService = inject(PayfreqService)
  userService = inject(UserService)
  logsService = inject(LogsService)
  fb = inject(FormBuilder)

  constructor() {
    this.addPayFreqForm = this.fb.group({
      payType: ['', Validators.required]
    })
  }

  onAddPayFreq(data: any) {
    if(confirm('Are you sure you want to add this pay frequency?')) {
      let logData: Log = {
        operation: 'Added Pay Frequency',
        user: this.userService.user()?.username ?? ''
      }

      let payFreqData: PayFreq = {
        payType: data.payType
      }

      this.payFreqService.addPayFreq(payFreqData).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          toast.success('Added Pay Frequency')
        }
      })
    }
  }
}