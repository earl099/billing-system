import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PositionService } from '../../../../services/position.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { ClientService } from '../../../../services/client.service';
import { LogsService } from '../../../../services/logs.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-position.list',
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
  templateUrl: './position.list.component.html',
  styleUrl: './position.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionListComponent implements OnInit {
  positionService = inject(PositionService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  clientService = inject(ClientService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  clients: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['posName', 'clientId', 'actions']
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getPositions()
  }


  getPositions(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.positionService.getPositions().subscribe((res) => {
        if(res) {
          let tmpData = res.positions

          this.clientService.getClients().subscribe((res) => {
            if(res) {
              let tmpData1 = res.clients

              for (let i = 0; i < tmpData1.length; i++) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].clientCode
                }

                this.clientData.push(data)
              }

              for(let i = 0; i < tmpData.length; i++) {
                for(let j = 0; j < this.clientData.length; j++) {
                  if(Number(tmpData[i].clientId) == Number(this.clientData[j].value)) {
                    tmpData[i].clientId = this.clientData[j].viewValue
                    break
                  }
                }
              }

              this.dataSource = new MatTableDataSource(tmpData)
              this.dataSource.paginator = this.paginator
              this.dataSource.sort = this.sort
            }
          })
        }
      })
    }
    else {
      this.positionService.getPositions(offset, limit).subscribe((res) => {
        if(res) {
          let tmpData = res.rows

          this.clientService.getClients().subscribe((res) => {
            let tmpData1 = res.clients

            for (let i = 0; i < tmpData1.length; i++) {
              let data = {
                value: tmpData1[i].id,
                viewValue: tmpData1[i].clientCode
              }

              this.clientData.push(data)
            }

            for(let i = 0; i < tmpData.length; i++) {
              for(let j = 0; j < this.clientData.length; j++) {
                if(Number(tmpData[i].clientId) == Number(this.clientData[j].value)) {
                  tmpData[i].clientId = this.clientData[j].viewValue
                  break
                }
              }
            }

            this.dataSource = new MatTableDataSource(tmpData)
            this.dataSource.paginator = this.paginator
            this.dataSource.paginator.length = tmpData.count
            this.dataSource.sort = this.sort
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

  openAddPosDialog() {
    const dialogRef = this.dialog.open(AddPositionDialog)

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getPositions()
    })
  }

  openViewPosDialog(id: number) {
    const dialogRef = this.dialog.open(ViewPositionDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getPositions()
    })
  }

  openEditPosDialog(id: number) {
    const dialogRef = this.dialog.open(EditPositionDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getPositions()
    })
  }

  delPos(id: number) {
    if(confirm('Are you sure you want to delete this position?')) {
      this.positionService.delPosition(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Position',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted position successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getPositions()
        }
      })
    }
  }
}

@Component({
  selector: 'add-position-dialog',
  templateUrl: './add.position.dialog.html',
  styleUrl: './position.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class AddPositionDialog {
  addPositionForm: FormGroup
  clientOptions: Array<any> = []
  statusOptions: Array<any> = []

  positionService = inject(PositionService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addPositionForm = this.fb.group({
      posCode: ['', Validators.required],
      posName: ['', Validators.required],
      clientId: ['', Validators.required],
      dailySalaryRate: [0.00],
      dailyBillingRate: [0.00],
      monthlySalaryRate: [0.00],
      monthlyBillingRate: [0.00],
      description: [''],
      status: ['', Validators.required]
    })

    this.clientService.getClients().subscribe((res) => {
      if(res) {
        let tmpData = res.clients

        for (let i = 0; i < tmpData.length; i++) {
          let data = {
            value: tmpData[i].id,
            viewValue: tmpData[i].clientName
          }

          this.clientOptions.push(data)
        }

        this.statusOptions = [
          {
            value: 'active',
            viewValue: 'Active'
          },
          {
            value: 'inactive',
            viewValue: 'Inactive'
          }
        ]
      }
    })
  }

  onAddPosition(data: any) {
    if(confirm('Are you sure you want to add this position?')) {
      let logData = {
        operation: 'Added Position',
        user: this.authService.getToken('user')
      }

      this.positionService.addPosition(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Added position successfully')
        }
      })
    }
  }

  //models for limitng input of user
  value: string | number = ''
  value1: string | number = ''
  value2: string | number = ''
  value3: string | number = ''

  validateDecimal(event: any) {
    const regex = /^[0-9]*\.?[0-9]{0,2}$/
    const currentValue = (event.target as HTMLInputElement).value
    const nextValue = currentValue + event.key

    if (!regex.test(nextValue) && event.key !== 'Backspace') {
      event.preventDefault();
    }
  }

  formatToTwoDecimals(data: any) {
    // If there's a value, format it to 2 decimal places
    if (data) {
       data = parseFloat(data.toString()).toFixed(2);
    }
  }
}

@Component({
  selector: 'view-position-dialog',
  templateUrl: './view.position.dialog.html',
  styleUrl: './position.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class ViewPositionDialog implements OnInit {
  positionService = inject(PositionService)
  clientService = inject(ClientService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  posId = this.data.id
  viewPositionForm: FormGroup

  constructor() {
    this.viewPositionForm = this.fb.group({
      posCode: ['', Validators.required],
      posName: ['', Validators.required],
      clientId: ['', Validators.required],
      dailySalaryRate: [0.00],
      dailyBillingRate: [0.00],
      monthlySalaryRate: [0.00],
      monthlyBillingRate: [0.00],
      description: [''],
      status: ['', Validators.required]
    })
  }
  ngOnInit(): void {
    this.getPosition(this.posId)
  }

  getPosition(id:number) {
    this.positionService.getPosition(id).subscribe((res) => {
      if(res) {
        let tmpData = res.position

        this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
          if(res) {
            let tmpData1 = res.client

            this.viewPositionForm.get('posCode')?.setValue(tmpData.posCode)
            this.viewPositionForm.get('posName')?.setValue(tmpData.posName)
            this.viewPositionForm.get('clientId')?.setValue(tmpData1.clientCode)
            this.viewPositionForm.get('dailySalaryRate')?.setValue(tmpData.dailySalaryRate)
            this.viewPositionForm.get('dailyBillingRate')?.setValue(tmpData.dailyBillingRate)
            this.viewPositionForm.get('monthlySalaryRate')?.setValue(tmpData.monthlySalaryRate)
            this.viewPositionForm.get('monthlyBillingRate')?.setValue(tmpData.monthlyBillingRate)
            this.viewPositionForm.get('description')?.setValue(tmpData.description)
            let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
            this.viewPositionForm.get('status')?.setValue(status)
          }
        })
      }
    })
  }
}

@Component({
  selector: 'edit-position-dialog',
  templateUrl: './edit.position.dialog.html',
  styleUrl: './position.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class EditPositionDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  posId = this.data.id
  editPositionForm: FormGroup

  positionService = inject(PositionService)
  clientService = inject(ClientService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions: Array<any> = []
  clientOptions: Array<any> = []

  constructor() {
    this.editPositionForm = this.fb.group({
      posCode: ['', Validators.required],
      posName: ['', Validators.required],
      clientId: ['', Validators.required],
      dailySalaryRate: [0.00],
      dailyBillingRate: [0.00],
      monthlySalaryRate: [0.00],
      monthlyBillingRate: [0.00],
      description: [''],
      status: ['', Validators.required]
    })

    this.statusOptions = [
      {
        value: 'active',
        viewValue: 'Active'
      },
      {
        value: 'inactive',
        viewValue: 'Inactive'
      }
    ]
  }

  ngOnInit(): void {
    this.getPosition(this.posId)
  }

  getPosition(id: number) {
    this.positionService.getPosition(id).subscribe((res) => {
      if(res) {
        let tmpData = res.position

        this.clientService.getClients().subscribe((res) => {
          if(res) {
            let tmpData1 = res.clients

            for (let i = 0; i < tmpData1.length; i++) {
              let data = {
                value: tmpData1[i].id,
                viewValue: tmpData1[i].clientCode
              }

              this.clientOptions.push(data)
            }

            this.editPositionForm.get('posCode')?.setValue(tmpData.posCode)
            this.editPositionForm.get('posName')?.setValue(tmpData.posName)
            this.editPositionForm.get('clientId')?.setValue(tmpData.clientId)
            this.editPositionForm.get('dailySalaryRate')?.setValue(tmpData.dailySalaryRate)
            this.editPositionForm.get('dailyBillingRate')?.setValue(tmpData.dailyBillingRate)
            this.editPositionForm.get('monthlySalaryRate')?.setValue(tmpData.monthlySalaryRate)
            this.editPositionForm.get('monthlyBillingRate')?.setValue(tmpData.monthlyBillingRate)
            this.editPositionForm.get('description')?.setValue(tmpData.description)
            this.editPositionForm.get('status')?.setValue(tmpData.status)
          }
        })
      }
    })
  }

  onEditPosition(data: any) {
    if(confirm('Are you sure you want to update this position?')) {
      this.positionService.editPosition(this.posId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Position',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Updated Position successfully')
        }
      })
    }
  }

  //models for limitng input of user
  value: string | number = ''
  value1: string | number = ''
  value2: string | number = ''
  value3: string | number = ''

  validateDecimal(event: any) {
    const regex = /^[0-9]*\.?[0-9]{0,2}$/
    const currentValue = (event.target as HTMLInputElement).value
    const nextValue = currentValue + event.key

    if (!regex.test(nextValue) && event.key !== 'Backspace') {
      event.preventDefault();
    }
  }

  formatToTwoDecimals(data: any) {
    // If there's a value, format it to 2 decimal places
    if (data) {
       data = parseFloat(data.toString()).toFixed(2);
    }
  }
}
