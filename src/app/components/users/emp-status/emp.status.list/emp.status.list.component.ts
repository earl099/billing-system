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
import { EmpStatusService } from '../../../../services/emp.status.service';
import { ClientService } from '../../../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-emp.status.list',
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
  templateUrl: './emp.status.list.component.html',
  styleUrl: './emp.status.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpStatusListComponent implements OnInit {
  empStatusService = inject(EmpStatusService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['empStatusName', 'clientId', 'actions']
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getEmpStatuses()
  }

  getEmpStatuses(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.empStatusService.getEmpStatuses().subscribe((res) => {
        if(res) {
          let tmpData = res.empStatuses

          this.clientService.getClients().subscribe((res) => {
            if(res) {
              let tmpData1 = res.clients

              for (let i = 0; i < tmpData1.length; i++) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].clientName
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
      this.empStatusService.getEmpStatuses(offset, limit).subscribe((res) => {
        if(res) {
          let tmpData = res.rows

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
              this.dataSource.paginator.length = tmpData.count
              this.dataSource.sort = this.sort
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

  openAddEmpStatusDialog() {
    const dialogRef = this.dialog.open(AddEmpStatusDialog)

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getEmpStatuses()
    })
  }

  openViewEmpStatus(id: number) {
    const dialogRef = this.dialog.open(ViewEmpStatusDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getEmpStatuses()
    })
  }

  openEditEmpStatus(id: number) {
    const dialogRef = this.dialog.open(EditEmpStatusDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getEmpStatuses()
    })
  }

  delEmpStatus(id: number) {
    if(confirm('Are you sure you want to delete this employment status?')) {
      this.empStatusService.delEmpStatus(Number(id)).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Employment Status',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted Employment Status successfully')
        }
      })
    }
  }
}

@Component({
  selector: 'add-emp-status-dialog',
  templateUrl: './add.emp.status.dialog.html',
  styleUrl: './emp.status.list.component.html',
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
export class AddEmpStatusDialog {
  addEmpStatusForm: FormGroup
  clientOptions: Array<any> = []
  statusOptions: Array<any> = []

  empStatusService = inject(EmpStatusService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addEmpStatusForm = this.fb.group({
      empStatusName: ['', Validators.required],
      clientId: [0, Validators.required],
      description: [],
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

  onAddEmpStatus(data: any) {
    if(confirm('Are you sure you want to add this employment status?')) {
      let logData = {
        operation: 'Added Employment Status',
        user: this.authService.getToken('user')
      }

      this.empStatusService.addEmpStatus(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Added Employment Status successfully')
        }
      })
    }
  }
}

@Component({
  selector: 'view-emp-status-dialog',
  templateUrl: './view.emp.status.dialog.html',
  styleUrl: './emp.status.list.component.scss',
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
export class ViewEmpStatusDialog implements OnInit {
  empStatusService = inject(EmpStatusService)
  clientService = inject(ClientService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  empStatusId = this.data.id
  viewEmpStatusForm: FormGroup

  constructor() {
    this.viewEmpStatusForm = this.fb.group({
      empStatusName: ['', Validators.required],
      clientId: [0, Validators.required],
      description: [],
      status: ['', Validators.required]
    })
  }
  ngOnInit(): void { }

  getEmpStatus(id: number) {
    this.empStatusService.getEmpStatus(id).subscribe((res) => {
      if(res) {
        let tmpData = res.empStatus

        this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
          if(res) {
            let tmpData1 = res.client

            this.viewEmpStatusForm.get('empStatusName')?.setValue(tmpData.empStatusName)
            this.viewEmpStatusForm.get('clientId')?.setValue(tmpData1.clientName)
            this.viewEmpStatusForm.get('description')?.setValue(tmpData.description)
            let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
            this.viewEmpStatusForm.get('status')?.setValue(status)
          }
        })
      }
    })
  }
}

@Component({
  selector: 'edit-emp-status-dialog',
  templateUrl: './edit.emp.status.dialog.html',
  styleUrl: './emp.status.list.component.html',
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
export class EditEmpStatusDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  empStatusId = this.data.id
  editEmpStatusForm: FormGroup

  empStatusService = inject(EmpStatusService)
  clientService = inject(ClientService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions: Array<any> = []
  clientOptions: Array<any> = []

  constructor() {
    this.editEmpStatusForm = this.fb.group({
      empStatusName: ['', Validators.required],
      clientId: [0, Validators.required],
      description: [],
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

  ngOnInit(): void {}

  getEmpStatus(id: number) {
    this.empStatusService.getEmpStatus(id).subscribe((res) => {
      if(res) {
        let tmpData = res.empStatus

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

            this.editEmpStatusForm.get('empStatusName')?.setValue(tmpData.empStatusName)
            this.editEmpStatusForm.get('clientId')?.setValue(tmpData.clientId)
            this.editEmpStatusForm.get('description')?.setValue(tmpData.description)
            this.editEmpStatusForm.get('status')?.setValue(tmpData.status)
          }
        })
      }
    })
  }

  onEditEmpStatus(data: any) {
    if(confirm('Are you sure you want to update this employment status?')) {
      this.empStatusService.editEmpStatus(this.empStatusId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Employment Status',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Updated Employment Status successfully')
        }
      })
    }
  }
}
