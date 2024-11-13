import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { WageService } from '../../../../services/wage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ClientService } from '../../../../services/client.service';

@Component({
  selector: 'app-wage.list',
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
  templateUrl: './wage.list.component.html',
  styleUrl: './wage.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WageListComponent implements OnInit {
  wageService = inject(WageService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['wageName', 'clientId', 'actions']
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getWages()
  }

  getWages(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.wageService.getWages().subscribe((res) => {
        if(res) {
          let tmpData = res.wages

          this.clientService.getClients().subscribe((res) => {
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
          })
        }
      })
    }
    else {
      this.wageService.getWages(offset, limit).subscribe((res) => {
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

  openAddWageDialog() {
    const dialogRef = this.dialog.open(AddWageDialog)

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length > 0) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }
      this.getWages()
    })
  }

  openViewWageDialog(id: number) {
    const dialogRef = this.dialog.open(ViewWageDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length > 0) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }
      this.getWages()
    })
  }

  openEditWageDialog(id: number) {
    const dialogRef = this.dialog.open(EditWageDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      if(this.dataSource.data.length > 0) {
        this.dataSource.data.splice(0, this.dataSource.data.length)
      }
      this.getWages()
    })
  }

  delWage(id: number) {
    if(confirm('Are you sure you want to delete this wage?')) {
      this.wageService.delWage(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Wage',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted wage successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getWages()
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

@Component({
  selector: 'add-wage-dialog',
  templateUrl: './add.wage.dialog.html',
  styleUrl: './wage.list.component.scss',
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
export class AddWageDialog {
  addWageForm: FormGroup
  clientOptions: Array<any> = []
  statusOptions: Array<any> = []

  wageService = inject(WageService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addWageForm = this.fb.group({
      wageName: ['', Validators.required],
      clientId: [0, Validators.required],
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

  onAddWage(data: any) {
    if(confirm('Are you sure you want to add this wage?')) {
      let logData = {
        operation: 'Added Wage',
        user: this.authService.getToken('user')
      }

      this.wageService.addWage(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Wage added successfully.')
        }
      })
    }
  }
}

@Component({
  selector: 'view-wage-dialog',
  templateUrl: './view.wage.dialog.html',
  styleUrl: './wage.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
  ]
})
export class ViewWageDialog implements OnInit {
  wageService = inject(WageService)
  clientService = inject(ClientService)

  data = inject(MAT_DIALOG_DATA)
  wageId = this.data.id
  fb  = inject(FormBuilder)
  viewWageForm: FormGroup

  constructor() {
    this.viewWageForm = this.fb.group({
      wageName: [''],
      clientId: [''],
      description: [''],
      status: ['']
    })
  }
  ngOnInit(): void {
    this.getWage(this.wageId)
  }

  getWage(id: number) {
    this.wageService.getWage(id).subscribe((res) => {
      if(res) {
        let tmpData = res.wage

        this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
          if(res) {
            let tmpData1 = res.client

            this.viewWageForm.get('wageName')?.setValue(tmpData.wageName)
            this.viewWageForm.get('clientId')?.setValue(tmpData1.clientName)
            this.viewWageForm.get('description')?.setValue(tmpData.description)
            let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
            this.viewWageForm.get('status')?.setValue(status)
          }
        })
      }
    })
  }
}

@Component({
  selector: 'edit-wage-dialog',
  templateUrl: './edit.wage.dialog.html',
  styleUrl: './wage.list.component.scss',
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
export class EditWageDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  editWageForm: FormGroup
  fb = inject(FormBuilder)
  wageId = this.data.id

  wageService = inject(WageService)
  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  statusOptions: Array<any> = []
  clientOptions: Array<any> = []

  constructor() {
    this.editWageForm = this.fb.group({
      wageName: ['', Validators.required],
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
    this.getWage(this.wageId)
  }

  getWage(id: number) {
    this.wageService.getWage(id).subscribe((res) => {
      if(res) {
        let tmpData = res.wage

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

            this.editWageForm.get('wageName')?.setValue(tmpData.wageName)
            this.editWageForm.get('clientId')?.setValue(tmpData.clientId)
            this.editWageForm.get('description')?.setValue(tmpData.description)
            this.editWageForm.get('status')?.setValue(tmpData.status)
          }
        })
      }
    })
  }

  onEditWage(data: any) {
    if(confirm('Are you sure you want to edit this wage?')) {
      this.wageService.editWage(this.wageId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Wage',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Updated Wage Successfully')
        }
      })
    }
  }
}
