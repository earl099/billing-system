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
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { DepartmentService } from '../../../../services/department.service';
import { ToastrService } from 'ngx-toastr';
import { ClientService } from '../../../../services/client.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dept.list',
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
  templateUrl: './dept.list.component.html',
  styleUrl: './dept.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeptListComponent implements OnInit {
  deptService = inject(DepartmentService)
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
  columns = ['deptName', 'clientId', 'actions']
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getDepts()
  }

  getDepts(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.deptService.getDepts().subscribe((res) => {
        if(res) {
          let tmpData = res.depts
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
            this.dataSource.sort = this.sort
          })
        }
      })
    }
    else {
      this.deptService.getDepts(offset, limit).subscribe((res) => {
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

  openAddDeptDialog() {
    const dialogRef = this.dialog.open(AddDeptDialog)

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getDepts()
    })
  }

  openViewDeptDialog(id: number) {
    const dialogRef = this.dialog.open(ViewDeptDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getDepts()
    })
  }

  openEditDeptDialog(id: number) {
    const dialogRef = this.dialog.open(EditDeptDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getDepts()
    })
  }

  delDept(id: number) {
    if(confirm('Are you sure you want to delete this classification?')) {
      this.deptService.delDept(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Department',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted department successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getDepts()
        }
      })
    }
  }
}

@Component({
  selector: 'add-dept-dialog',
  templateUrl: './add.dept.dialog.html',
  styleUrl: './dept.list.component.scss',
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
export class AddDeptDialog {
  addDeptForm: FormGroup
  clientOptions: Array<any> = []
  statusOptions: Array<any> = []

  deptService = inject(DepartmentService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addDeptForm = this.fb.group({
      clientId: [0, Validators.required],
      deptCode: ['', Validators.required],
      deptName: ['', Validators.required],
      status: ['', Validators.required],
      description: ['']
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

  onAddDept(data: any) {
    if(confirm('Are you sure you want to add this department?')) {
      let logData = {
        operation: 'Added Department',
        user: this.authService.getToken('user')
      }

      this.deptService.addDept(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Added department successfully')
        }
      })
    }
  }
}

@Component({
  selector: 'view-dept-dialog',
  templateUrl: './view.dept.dialog.html',
  styleUrl: './dept.list.component.scss',
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
export class ViewDeptDialog implements OnInit {
  deptService = inject(DepartmentService)
  clientService = inject(ClientService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  deptId = this.data.id
  viewDeptForm: FormGroup

  constructor() {
    this.viewDeptForm = this.fb.group({
      clientId: [0, Validators.required],
      deptCode: ['', Validators.required],
      deptName: ['', Validators.required],
      status: ['', Validators.required],
      description: ['']
    })
  }
  ngOnInit(): void {
    this.getDept(this.deptId)
  }

  getDept(id: number) {
    this.deptService.getDept(id).subscribe((res) => {
      let tmpData = res.dept

      this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
        if(res) {
          let tmpData1 = res.client

          this.viewDeptForm.get('clientId')?.setValue(tmpData1.clientCode)
          this.viewDeptForm.get('deptCode')?.setValue(tmpData.deptCode)
          this.viewDeptForm.get('deptName')?.setValue(tmpData.deptName)
          let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
          this.viewDeptForm.get('status')?.setValue(status)
          this.viewDeptForm.get('description')?.setValue(tmpData.description)
        }
      })
    })
  }
}

@Component({
  selector: 'edit-dept-dialog',
  templateUrl: './edit.dept.dialog.html',
  styleUrl: './dept.list.component.scss',
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
export class EditDeptDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  editDeptForm: FormGroup
  deptId = this.data.id

  deptService = inject(DepartmentService)
  clientService = inject(ClientService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions: Array<any> = []
  clientOptions: Array<any> = []

  constructor() {
    this.editDeptForm = this.fb.group({
      clientId: [0, Validators.required],
      deptCode: ['', Validators.required],
      deptName: ['', Validators.required],
      status: ['', Validators.required],
      description: ['']
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
    this.getDept(this.deptId)
  }

  getDept(id: number) {
    this.deptService.getDept(id).subscribe((res) => {
      let tmpData = res.dept

      this.clientService.getClients().subscribe((res) => {
        let tmpData1 = res.clients

        for (let i = 0; i < tmpData1.length; i++) {
          let data = {
            value: tmpData1[i].id,
            viewValue: tmpData1[i].clientCode
          }

          this.clientOptions.push(data)
        }

        this.editDeptForm.get('clientId')?.setValue(tmpData.clientId)
        this.editDeptForm.get('deptCode')?.setValue(tmpData.deptCode)
        this.editDeptForm.get('deptName')?.setValue(tmpData.deptName)
        this.editDeptForm.get('status')?.setValue(tmpData.status)
        this.editDeptForm.get('description')?.setValue(tmpData.description)
      })
    })
  }

  onEditDept(data: any) {
    if(confirm('Are you sure you want to edit this classification')) {
      this.deptService.editDept(this.deptId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Department',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Edited Department successfully')
        }
      })
    }
  }
}
