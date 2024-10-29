import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { ClassificationService } from '../../../../services/classification.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ClientService } from '../../../../services/client.service';

@Component({
  selector: 'app-class.list',
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
  templateUrl: './class.list.component.html',
  styleUrl: './class.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassListComponent implements OnInit {
  authService = inject(AuthService)
  logsService = inject(LogsService)
  classService = inject(ClassificationService)
  clientService = inject(ClientService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  clients: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['className', 'clientId', 'actions']
  clientData: Array<any> = []

  constructor() {}

  ngOnInit(): void {
    this.getClasses()
  }

  getClasses(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.classService.getClasses().subscribe((res) => {
        if(res) {
          let tmpData = res.classifications
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
      this.classService.getClasses(offset, limit).subscribe((res) => {
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

  openAddClassDialog() {
    const dialogRef = this.dialog.open(AddClassDialog)

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length < 1) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }

      this.getClasses()
    })
  }

  openViewClassDialog(id: number) {
    const dialogRef = this.dialog.open(ViewClassDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getClasses()
    })
  }

  openEditClassDialog(id: number) {
    const dialogRef = this.dialog.open(EditClassDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getClasses()
    })
  }

  delClass(id: number) {
    if(confirm('Are you sure you want to delete this classification?')) {
      this.classService.delClass(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Classification',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted classification successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getClasses()
        }
      })
    }
  }
}

@Component({
  selector: 'add-class-dialog',
  templateUrl: './add.class.dialog.html',
  styleUrl: './class.list.component.scss',
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
export class AddClassDialog implements OnInit {
  addClassForm: FormGroup
  clientOptions: Array<any> = []
  statusOptions: Array<any> = []

  classService = inject(ClassificationService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addClassForm = this.fb.group({
      clientId: [0, Validators.required],
      className: ['', Validators.required],
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

  ngOnInit(): void { }


  onAddClass(data: any) {
    if(confirm('Are you sure you want to add this classification?')) {
      let logData = {
        operation: 'Added Classification',
        user: this.authService.getToken('user')
      }

      this.classService.addClass(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Added classification successfully')
        }
      })
    }
  }
}

@Component({
  selector: 'view-class-dialog',
  templateUrl: './view.class.dialog.html',
  styleUrl: './class.list.component.scss',
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
export class ViewClassDialog implements OnInit {
  classService = inject(ClassificationService)
  clientService = inject(ClientService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  classId = this.data.id
  viewClassForm: FormGroup

  constructor() {
    this.viewClassForm = this.fb.group({
      clientId: [''],
      className: [''],
      status: [''],
      description: ['']
    })
  }

  ngOnInit(): void {
    this.getClass(this.classId)
  }

  getClass(id: number) {
    this.classService.getClass(id).subscribe((res) => {
      if(res) {
        let tmpData = res.classObj

        this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
          if(res) {
            let tmpData1 = res.client

            this.viewClassForm.get('clientId')?.setValue(tmpData1.clientCode)
            this.viewClassForm.get('className')?.setValue(tmpData.className)
            let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
            this.viewClassForm.get('status')?.setValue(status)
            this.viewClassForm.get('description')?.setValue(tmpData.description)
          }
        })
      }
    })
  }
}

@Component({
  selector: 'edit-class-dialog',
  templateUrl: './edit.class.dialog.html',
  styleUrl: './class.list.component.scss',
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
export class EditClassDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  editClassForm: FormGroup
  classId = this.data.id

  clientService = inject(ClientService)
  classService = inject(ClassificationService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions = [
    {
      value: 'active',
      viewValue: 'Active'
    },
    {
      value: 'inactive',
      viewValue: 'Inactive'
    }
  ]

  clientOptions: Array<any> = []

  constructor() {
    this.editClassForm = this.fb.group({
      clientId: [0, Validators.required],
      className: ['', Validators.required],
      status: ['', Validators.required],
      description: ['']
    })
  }

  ngOnInit(): void {
    this.getClass(this.classId)
  }

  getClass(id: number) {
    this.classService.getClass(id).subscribe((res) => {
      let tmpData = res.classObj

      this.clientService.getClients().subscribe((res) => {
        let tmpData1 = res.clients

        for (let i = 0; i < tmpData1.length; i++) {
          let data = {
            value: tmpData1[i].id,
            viewValue: tmpData1[i].clientCode
          }

          this.clientOptions.push(data)
        }

        this.editClassForm.get('clientId')?.setValue(tmpData.clientId)
        this.editClassForm.get('className')?.setValue(tmpData.className)
        this.editClassForm.get('status')?.setValue(tmpData.status)
        this.editClassForm.get('description')?.setValue(tmpData.description)
      })
    })
  }

  onEditClass(data: any) {
    if(confirm('Are you sure you want to edit this classification')) {
      this.classService.editClass(this.classId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Edited Classification',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Edited classification successfully')
        }
      })
    }
  }
}
