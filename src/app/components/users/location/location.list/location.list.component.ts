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
import { LocationService } from '../../../../services/location.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { DepartmentService } from '../../../../services/department.service';
import { LogsService } from '../../../../services/logs.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-location.list',
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
  templateUrl: './location.list.component.html',
  styleUrl: './location.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationListComponent implements OnInit {
  locService = inject(LocationService)
  deptService = inject(DepartmentService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  depts: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['locName', 'deptId', 'actions']
  deptData: Array<any> = []

  constructor() { }
  ngOnInit(): void {
    this.getLocs()
  }

  getLocs(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.locService.getLocs().subscribe((res) => {
        if(res) {
          let tmpData = res.locs

          this.deptService.getDepts().subscribe((res) => {
            if(res) {
              let tmpData1 = res.depts

              for (let i = 0; i < tmpData1.length; i++) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].deptCode
                }

                this.deptData.push(data)
              }

              for(let i = 0; i < tmpData.length; i++) {
                for(let j = 0; j < this.deptData.length; j++) {
                  if(Number(tmpData[i].deptId) == Number(this.deptData[j].value)) {
                    tmpData[i].deptId = this.deptData[j].viewValue
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
      this.locService.getLocs().subscribe((res) => {
        if(res) {
          let tmpData = res.rows

          this.deptService.getDepts().subscribe((res) => {
            if(res) {
              let tmpData1 = res.depts

              for (let i = 0; i < tmpData1.length; i++) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].deptCode
                }

                this.deptData.push(data)
              }

              for(let i = 0; i < tmpData.length; i++) {
                for(let j = 0; j < this.deptData.length; j++) {
                  if(Number(tmpData[i].deptId) == Number(this.deptData[j].value)) {
                    tmpData[i].deptId = this.deptData[j].viewValue
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

  openAddLocDialog() {
    const dialogRef = this.dialog.open(AddLocationDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getLocs()
    })
  }

  openViewLocDialog(id: number) {
    const dialogRef = this.dialog.open(ViewLocationDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getLocs()
    })
  }

  openEditLocDialog(id: number) {
    const dialogRef = this.dialog.open(EditLocationDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getLocs()
    })
  }

  delLoc(id: number) {
    if(confirm('Are you sure you want to delete this location?')) {
      this.locService.delLoc(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Location',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted Location successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getLocs()
        }
      })
    }
  }
}

@Component({
  selector: 'add-location-dialog',
  templateUrl: './add.location.dialog.html',
  styleUrl: './location.list.component.scss',
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
export class AddLocationDialog {
  addLocForm: FormGroup
  deptOptions: Array<any> = []
  statusOptions: Array<any> = []

  locationService = inject(LocationService)
  deptService = inject(DepartmentService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addLocForm = this.fb.group({
      locName: ['', Validators.required],
      deptId: [0, Validators.required],
      type: [''],
      description: [''],
      status: ['', Validators.required]
    })

    this.deptService.getDepts().subscribe((res) => {
      if(res) {
        let tmpData = res.depts

        for (let i = 0; i < tmpData.length; i++) {
          let data = {
            value: tmpData[i].id,
            viewValue: tmpData[i].deptName
          }

          this.deptOptions.push(data)
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

  onAddLoc(data: any) {
    if(confirm('Are you sure you want to add this data?')) {
      let logData = {
        operation: 'Added Location',
        user: this.authService.getToken('user')
      }

      this.locationService.addLoc(data.value).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Location added successfully')
        }
      })
    }
  }
}


@Component({
  selector: 'view-location-dialog',
  templateUrl: './view.location.dialog.html',
  styleUrl: './location.list.component.scss',
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
export class ViewLocationDialog implements OnInit {
  locationService = inject(LocationService)
  deptService = inject(DepartmentService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  locId = this.data.id
  viewLocForm: FormGroup

  constructor() {
    this.viewLocForm = this.fb.group({
      wageName: [''],
      deptName: [''],
      type: [''],
      description: [''],
      status: ['']
    })
  }

  ngOnInit(): void {
    this.getLoc(this.locId)
  }

  getLoc(id: number) {
    this.locationService.getLoc(id).subscribe((res) => {
      if(res) {
        let tmpData = res.loc

        this.deptService.getDept(Number(tmpData.deptId)).subscribe((res) => {
          let tmpData1 = res.dept

          this.viewLocForm.get('wageName')?.setValue(tmpData.wageName)
          this.viewLocForm.get('deptName')?.setValue(tmpData1.deptName)
          this.viewLocForm.get('type')?.setValue(tmpData.type)
          this.viewLocForm.get('description')?.setValue(tmpData.description)
          let status = tmpData.status == 'active' ? 'Active' : 'Inactive'
          this.viewLocForm.get('status')?.setValue(status)
        })
      }
    })
  }
}

@Component({
  selector: 'edit-location-dialog',
  templateUrl: './edit.location.dialog.html',
  styleUrl: './location.list.component.scss',
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
export class EditLocationDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  locId = this.data.id
  editLocForm: FormGroup

  locationService = inject(LocationService)
  deptService = inject(DepartmentService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions: Array<any> = []
  deptOptions: Array<any> = []

  constructor() {
    this.editLocForm = this.fb.group({
      wageName: ['', Validators.required],
      deptId: [0, Validators.required],
      type: [''],
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

  ngOnInit(): void { }

  getLoc(id: number) {
    this.locationService.getLoc(id).subscribe((res) => {
      if(res) {
        let tmpData = res.loc

        this.deptService.getDept(Number(tmpData.deptId)).subscribe((res) => {
          if(res) {
            let tmpData1 = res.dept

            for (let i = 0; i < tmpData1.length; i++) {
              let data = {
                value: tmpData1[i].id,
                viewValue: tmpData1[i].deptCode
              }

              this.deptOptions.push(data)
            }

            this.editLocForm.get('wageName')?.setValue(tmpData.wageName)
            this.editLocForm.get('deptId')?.setValue(tmpData.deptId)
            this.editLocForm.get('type')?.setValue(tmpData.type)
            this.editLocForm.get('description')?.setValue(tmpData.depscription)
            this.editLocForm.get('status')?.setValue(tmpData.status)
          }
        })
      }
    })
  }

  onEditLoc(data: any) {
    if(confirm('Are you sure you want to edit this location?')) {
      this.locationService.editLoc(this.locId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Location',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Updated Location successfully')
        }
      })
    }
  }
}
