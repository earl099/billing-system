import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { EmployeeService } from '../../../../services/employee.service';
import { ClientService } from '../../../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { DepartmentService } from '../../../../services/department.service';
import { LocationService } from '../../../../services/location.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ClassificationService } from '../../../../services/classification.service';
import { PositionService } from '../../../../services/position.service';
import { EmpStatusService } from '../../../../services/emp.status.service';
import { WageService } from '../../../../services/wage.service';
import { provideNativeDateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-employee.list',
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
  templateUrl: './employee.list.component.html',
  styleUrl: './employee.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent implements OnInit {

  employeeService = inject(EmployeeService)
  clientService = inject(ClientService)
  deptService = inject(DepartmentService)
  locService = inject(LocationService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  deptData: Array<any> = []
  locData: Array<any> = []
  clientList: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['empId', 'empName', 'deptName', 'locName', 'actions']

  ngOnInit(): void {
    this.getEmps()
  }

  getEmps(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      if(Number(this.authService.getToken('client')) == 0) {
        this.employeeService.getEmps().subscribe((res) => {
          if(res) {
            let tmpData = res.emps

            this.deptService.getDepts().subscribe((res) => {
              if(res) {
                let tmpData1 = res.depts

                this.locService.getLocs().subscribe((res) => {
                  if(res) {
                    let tmpData2 = res.locs

                    for(let i = 0; i < tmpData1.length; i++) {
                      let data = {
                        value: tmpData1[i].id,
                        viewValue: tmpData1[i].deptName
                      }

                      this.deptData.push(data)
                    }

                    for(let i = 0; i < tmpData2.length; i++) {
                      let data = {
                        value: tmpData2[i].id,
                        viewValue: tmpData2[i].locName
                      }

                      this.locData.push(data)
                    }

                    for(let i = 0; i < tmpData.length; i++) {
                      for(let j = 0; j < this.deptData.length; j++) {
                        if(Number(tmpData[i].deptId) == Number(this.deptData[j].value)) {
                          tmpData[i].deptId = this.deptData[j].viewValue
                          break
                        }
                      }
                    }

                    for(let i = 0; i < tmpData.length; i++) {
                      for(let j = 0; j < this.locData.length; j++) {
                        if(Number(tmpData[i].locId) == Number(this.locData[j].value)) {
                          tmpData[i].locId = this.locData[j].viewValue
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
        })
      }
      else {
        this.employeeService.getEmps().subscribe((res) => {
          if(res) {
            let tmpData = res.emps

            for(let i = 0; i < tmpData.length; i++) {
              if(Number(this.authService.getToken('client')) == tmpData[i].clientId) {
                this.clientList.push(tmpData[i])
              }
            }
            this.deptService.getDepts().subscribe((res) => {
              if(res) {
                let tmpData1 = res.depts

                this.locService.getLocs().subscribe((res) => {
                  if(res) {
                    let tmpData2 = res.locs

                    for(let i = 0; i < tmpData1.length; i++) {
                      if(Number(this.authService.getToken('client')) == tmpData1[i].clientId) {
                        let data = {
                          value: tmpData1[i].id,
                          viewValue: tmpData1[i].deptName
                        }

                        this.deptData.push(data)
                      }
                    }

                    for(let i = 0; i < tmpData2.length; i++) {
                      for (let j = 0; j < tmpData1.length; j++) {
                        if(tmpData1[j].id == tmpData2[i].deptId) {
                          let data = {
                            value: tmpData2[i].id,
                            viewValue: tmpData2[i].locName
                          }

                          this.locData.push(data)
                        }
                      }
                    }

                    for(let i = 0; i < this.clientList.length; i++) {
                      for(let j = 0; j < this.deptData.length; j++) {
                        if(Number(this.clientList[i].deptId) == Number(this.deptData[j].value)) {
                          this.clientList[i].deptId = this.deptData[j].viewValue
                          break
                        }
                      }
                    }

                    for(let i = 0; i < this.clientList.length; i++) {
                      for(let j = 0; j < this.locData.length; j++) {
                        if(Number(this.clientList[i].locId) == Number(this.locData[j].value)) {
                          this.clientList[i].locId = this.locData[j].viewValue
                          break
                        }
                      }
                    }

                    this.dataSource = new MatTableDataSource(this.clientList)
                    this.dataSource.paginator = this.paginator
                    this.dataSource.sort = this.sort
                  }
                })
              }
            })
          }
        })
      }
    }
    else {
      if(Number(this.authService.getToken('client')) == 0) {
        this.employeeService.getEmps(offset, limit).subscribe((res) => {
          if(res) {
            let tmpData = res.rows

            this.deptService.getDepts().subscribe((res) => {
              if(res) {
                let tmpData1 = res.depts

                this.locService.getLocs().subscribe((res) => {
                  if(res) {
                    let tmpData2 = res.locs

                    for(let i = 0; i < tmpData1.length; i++) {
                      let data = {
                        value: tmpData1[i].id,
                        viewValue: tmpData1[i].deptName
                      }

                      this.deptData.push(data)
                    }

                    for(let i = 0; i < tmpData1.length; i++) {
                      let data = {
                        value: tmpData2[i].id,
                        viewValue: tmpData2[i].locName
                      }

                      this.locData.push(data)
                    }

                    for(let i = 0; i < tmpData.length; i++) {
                      for(let j = 0; j < this.deptData.length; j++) {
                        if(Number(tmpData[i].deptId) == Number(this.deptData[j].value)) {
                          tmpData[i].deptId = this.deptData[j].viewValue
                          break
                        }
                      }
                    }

                    for(let i = 0; i < tmpData.length; i++) {
                      for(let j = 0; j < this.locData.length; j++) {
                        if(Number(tmpData[i].locId) == Number(this.locData[j].value)) {
                          tmpData[i].locId = this.locData[j].viewValue
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
        })
      }
      else {
        this.employeeService.getEmps(offset, limit).subscribe((res) => {
          if(res) {
            let tmpData = res.rows

            for(let i = 0; i < tmpData.length; i++) {
              if(Number(this.authService.getToken('client')) == tmpData[i].clientId) {
                this.clientList.push(tmpData[i])
              }
            }
            this.deptService.getDepts().subscribe((res) => {
              if(res) {
                let tmpData1 = res.depts

                this.locService.getLocs().subscribe((res) => {
                  if(res) {
                    let tmpData2 = res.locs

                    for(let i = 0; i < tmpData1.length; i++) {
                      if(Number(this.authService.getToken('client')) == tmpData1[i].clientId) {
                        let data = {
                          value: tmpData1[i].id,
                          viewValue: tmpData1[i].deptName
                        }

                        this.deptData.push(data)
                      }
                    }

                    for(let i = 0; i < tmpData2.length; i++) {
                      for (let j = 0; j < tmpData1.length; j++) {
                        if(tmpData1[j].id == tmpData2[i].deptId) {
                          let data = {
                            value: tmpData2[i].id,
                            viewValue: tmpData2[i].locName
                          }

                          this.locData.push(data)
                        }
                      }
                    }

                    for(let i = 0; i < this.clientList.length; i++) {
                      for(let j = 0; j < this.deptData.length; j++) {
                        if(Number(this.clientList[i].deptId) == Number(this.deptData[j].value)) {
                          this.clientList[i].deptId = this.deptData[j].viewValue
                          break
                        }
                      }
                    }

                    for(let i = 0; i < this.clientList.length; i++) {
                      for(let j = 0; j < this.locData.length; j++) {
                        if(Number(this.clientList[i].locId) == Number(this.locData[j].value)) {
                          this.clientList[i].locId = this.locData[j].viewValue
                          break
                        }
                      }
                    }

                    this.dataSource = new MatTableDataSource(this.clientList)
                    this.dataSource.paginator = this.paginator
                    this.dataSource.paginator.length = res.count
                    this.dataSource.sort = this.sort
                  }
                })
              }
            })
          }
        })
      }
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

  openAddEmpDialog() {
    const dialogRef = this.dialog.open(AddEmployeeDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getEmps()
    })
  }

  openViewEmpDialog(id: number) {
    const dialogRef = this.dialog.open(ViewEmployeeDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getEmps()
    })
  }

  openEditEmpDialog(id: number) {
    const dialogRef = this.dialog.open(EditEmployeeDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getEmps()
    })
  }

  delEmp(id: number) {
    if(confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.delEmp(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Employee',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted employee successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getEmps()
        }
      })
    }
  }
}

@Component({
  selector: 'add-employee-dialog',
  templateUrl: './add.employee.dialog.html',
  styleUrl: './employee.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatExpansionModule,
    MatSelectModule,
    MatDatepickerModule,
    ReactiveFormsModule
  ]
})
export class AddEmployeeDialog {
  addEmpForm: FormGroup

  clientData: any
  genderOptions: Array<any> = []
  clientOptions: Array<any> = []
  classificationOptions: Array<any> = []
  deptOptions: Array<any> = []
  locOptions: Array<any> = []
  posOptions: Array<any> = []
  empStatusOptions: Array<any> = []
  wageOptions: Array<any> = []

  empService = inject(EmployeeService)
  clientService = inject(ClientService)
  classificationService = inject(ClassificationService)
  deptService = inject(DepartmentService)
  locService = inject(LocationService)
  posService = inject(PositionService)
  empStatService = inject(EmpStatusService)
  wageService = inject(WageService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addEmpForm = this.fb.group({
      empId: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      suffix: [''],
      gender: [''],
      dateOfBirth: [''],
      education: [''],
      email1: ['', Validators.email],
      email2: ['', Validators.email],
      mobileNum1: [''],
      mobileNum2: [''],
      civilStatus: [''],
      clientId: [0, Validators.required],
      classId: [{value: 0, disabled: true}, Validators.required],
      deptId: [{value: 0, disabled: true}, Validators.required],
      locId: [{value: 0, disabled: true}, Validators.required],
      posId: [{value: 0, disabled: true}, Validators.required],
      empStatusId: [{value: 0, disabled: true}, Validators.required],
      wageId: [{value: 0, disabled: true}, Validators.required],
      remarks: ['']
    })

    this.addEmpForm.get('dateOfBirth')?.patchValue(this.formatDate(new Date()))

    if(this.authService.getToken('userType') == 'User') {
      this.addEmpForm.get('classId')?.enable()
    }

    this.genderOptions = [
      {
        value: 'male',
        viewValue: 'Male'
      },
      {
        value: 'female',
        viewValue: 'Female'
      }
    ]

    if(this.authService.getToken('userType') == 'Admin') {
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
        }
      })
    }
    else {
      this.clientService.getClient(Number(this.authService.getToken('client'))).subscribe((res) => {
        if(res) {
          this.clientData = res.client
          this.addEmpForm.get('clientId')?.setValue(this.clientData.clientName)

          this.classificationService.getClasses().subscribe((res) => {
            if(res) {
              let tmpData = res.classifications

              for (let i = 0; i < tmpData.length; i++) {
                if(this.clientData.id == tmpData[i].clientId) {
                  this.classificationOptions.push(tmpData[i])
                }
              }
              //console.log(this.classificationOptions)

              this.deptService.getDepts().subscribe((res) => {
                if(res) {
                  let tmpData1 = res.depts

                  for (let i = 0; i < tmpData1.length; i++) {
                    if(this.clientData.id == tmpData1[i].clientId) {
                      this.deptOptions.push(tmpData1[i])
                    }
                  }

                  //console.log(this.deptOptions)

                  this.posService.getPositions().subscribe((res) => {
                    if(res) {
                      let tmpData2 = res.positions

                      for (let i = 0; i < tmpData2.length; i++) {
                        if(this.clientData.id == tmpData2[i].clientId) {
                          this.posOptions.push(tmpData2[i])
                        }

                      }

                      this.empStatService.getEmpStatuses().subscribe((res) => {
                        if(res) {
                          let tmpData3 = res.empStatuses

                          for (let i = 0; i < tmpData3.length; i++) {
                            if(this.clientData.id == tmpData3[i].clientId) {
                              this.empStatusOptions.push(tmpData3[i])
                            }
                          }

                          this.wageService.getWages().subscribe((res) => {
                            if(res) {
                              let tmpData4 = res.wages

                              for (let i = 0; i < tmpData4.length; i++) {
                                if(this.clientData.id == tmpData4[i].clientId) {
                                  this.wageOptions.push(tmpData4[i])
                                }
                              }
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
          //console.log(this.clientData)
        }
      })
    }
  }

  private formatDate(date: Date) {
    const d = new Date(date)
    let month = '' + d.getMonth() + 1
    let day = '' + d.getDate()
    const year = d.getFullYear()
    if(month.length < 2) { month = '0' + month }
    if(day.length < 2) { day = '0' + day }
    return [month, day, year].join('-')
  }

  //admin function only
  onClientChange(clientId: number) {
    this.clientService.getClient(clientId).subscribe((res) => {
      if(res) {
        this.clientData = res.client
        this.addEmpForm.get('clientId')?.setValue(this.clientData.id)

        this.classificationService.getClasses().subscribe((res) => {
          if(res) {
            let tmpData = res.classifications

            if(this.classificationOptions.length > 0) {
              this.classificationOptions.splice(0, this.classificationOptions.length)
            }

            for (let i = 0; i < tmpData.length; i++) {
              if(this.clientData.id == tmpData[i].clientId) {
                this.classificationOptions.push(tmpData[i])
              }
            }
            //console.log(this.classificationOptions)

            this.deptService.getDepts().subscribe((res) => {
              if(res) {
                let tmpData1 = res.depts

                if(this.deptOptions.length > 0) {
                  this.deptOptions.splice(0, this.deptOptions.length)
                }

                for (let i = 0; i < tmpData1.length; i++) {
                  if(this.clientData.id == tmpData1[i].clientId) {
                    this.deptOptions.push(tmpData1[i])
                  }
                }

                //console.log(this.deptOptions)

                this.posService.getPositions().subscribe((res) => {
                  if(res) {
                    let tmpData2 = res.positions

                    if(this.posOptions.length > 0) {
                      this.posOptions.splice(0, this.posOptions.length)
                    }

                    for (let i = 0; i < tmpData2.length; i++) {
                      if(this.clientData.id == tmpData2[i].clientId) {
                        this.posOptions.push(tmpData2[i])
                      }

                    }

                    this.empStatService.getEmpStatuses().subscribe((res) => {
                      if(res) {
                        let tmpData3 = res.empStatuses

                        if(this.empStatusOptions.length > 0) {
                          this.empStatusOptions.splice(0, this.empStatusOptions.length)
                        }

                        for (let i = 0; i < tmpData3.length; i++) {
                          if(this.clientData.id == tmpData3[i].clientId) {
                            this.empStatusOptions.push(tmpData3[i])
                          }
                        }

                        this.wageService.getWages().subscribe((res) => {
                          if(res) {
                            let tmpData4 = res.wages

                            if(this.wageOptions.length > 0) {
                              this.wageOptions.splice(0, this.wageOptions.length)
                            }

                            for (let i = 0; i < tmpData4.length; i++) {
                              if(this.clientData.id == tmpData4[i].clientId) {
                                this.wageOptions.push(tmpData4[i])
                              }

                            }
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
        })
        //console.log(this.clientData)
      }
    })
  }

  onClassChange() {
    this.addEmpForm.get('deptId')?.enable()
  }

  onDeptChange(deptId: number) {
    this.addEmpForm.get('locId')?.enable()
    this.locService.getLocs().subscribe((res) => {
      if(res) {
        let locs = res.locs

        for (let i = 0; i < locs.length; i++) {
          if(deptId == locs[i].deptId) {
            this.locOptions.push(locs[i])
          }
        }

        console.log(this.locOptions)
      }
    })
  }

  onLocChange() {
    this.addEmpForm.get('posId')?.enable()
  }

  onPosChange() {
    this.addEmpForm.get('empStatusId')?.enable()
  }

  onEmpStatusChange() {
    this.addEmpForm.get('wageId')?.enable()
  }

  onAddEmp(data: any) {
    if(confirm('Are you sure you want to add this employee?')) {
      if(this.authService.getToken('userType') == 'User') {
        data.value.clientId = Number(this.authService.getToken('client'))
      }


      this.empService.addEmp(data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Added Employee',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Added Employee Successfully')
        }
      })
    }
  }
}

@Component({
  selector: 'view-employee-dialog',
  templateUrl: './view.employee.dialog.html',
  styleUrl: './employee.list.component.scss',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class ViewEmployeeDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  empId = this.data.id
  viewEmpForm: FormGroup

  empService = inject(EmployeeService)
  clientService = inject(ClientService)
  classificationService = inject(ClassificationService)
  deptService = inject(DepartmentService)
  locService = inject(LocationService)
  posService = inject(PositionService)
  empStatService = inject(EmpStatusService)
  wageService = inject(WageService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)


  constructor() {
    this.viewEmpForm = this.fb.group({
      empId: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      suffix: [''],
      gender: [''],
      dateOfBirth: [''],
      education: [''],
      email1: [''],
      email2: [''],
      mobileNum1: [''],
      mobileNum2: [''],
      civilStatus: [''],
      clientId: [''],
      classId: [''],
      deptId: [''],
      locId: [''],
      posId: [''],
      empStatusId: [''],
      wageId: [''],
      remarks: ['']
    })
  }

  ngOnInit(): void {
    this.getEmp(this.empId)
  }

  getEmp(id: number) {
    this.empService.getEmp(id).subscribe((res) => {
      if(res) {
        let tmpData = res.emp
        this.viewEmpForm.get('empId')?.setValue(tmpData.empId)
        this.viewEmpForm.get('firstName')?.setValue(tmpData.firstName)
        this.viewEmpForm.get('middleName')?.setValue(tmpData.middleName)
        this.viewEmpForm.get('lastName')?.setValue(tmpData.lastName)
        this.viewEmpForm.get('suffix')?.setValue(tmpData.suffix)
        let gender = tmpData.gender == 'male' ? 'Male' : 'Female'
        this.viewEmpForm.get('gender')?.setValue(gender)
        this.viewEmpForm.get('dateOfBirth')?.setValue(tmpData.dateOfBirth)
        this.viewEmpForm.get('education')?.setValue(tmpData.education)
        this.viewEmpForm.get('email1')?.setValue(tmpData.email1)
        this.viewEmpForm.get('email2')?.setValue(tmpData.email2)
        this.viewEmpForm.get('mobileNum1')?.setValue(tmpData.mobileNum1)
        this.viewEmpForm.get('mobileNum2')?.setValue(tmpData.mobileNum2)
        this.viewEmpForm.get('civilStatus')?.setValue(tmpData.civilStatus)
        this.viewEmpForm.get('remarks')?.setValue(tmpData.remarks)

        this.viewEmpForm.get('clientId')?.setValue(tmpData.clientId)
        this.viewEmpForm.get('classId')?.setValue(tmpData.classId)

        this.clientService.getClient(Number(tmpData.clientId)).subscribe((res) => {
          if(res) {
            let tmpData2 = res.client
            this.viewEmpForm.get('clientId')?.setValue(tmpData2.clientName)
          }
        })

        this.classificationService.getClass(Number(tmpData.classId)).subscribe((res) => {
          if(res) {
            let tmpData3 = res.classObj
            //console.log(tmpData3)
            this.viewEmpForm.get('classId')?.setValue(tmpData3.className)
          }
        })

        this.deptService.getDept(tmpData.deptId).subscribe((res) => {
          if(res) {
            let tmpData4 = res.dept
            this.viewEmpForm.get('deptId')?.setValue(tmpData4.deptName)

            this.locService.getLoc(tmpData.locId).subscribe((res) => {
              if(res) {
                let tmpData5 = res.loc
                this.viewEmpForm.get('locId')?.setValue(tmpData5.locName)

                this.posService.getPosition(tmpData.posId).subscribe((res) => {
                  if(res) {
                    let tmpData6 = res.position
                    this.viewEmpForm.get('posId')?.setValue(tmpData6.posName)

                    this.empStatService.getEmpStatus(tmpData.empStatusId).subscribe((res) => {
                      let tmpData7 = res.empStatus
                      this.viewEmpForm.get('empStatusId')?.setValue(tmpData7.empStatusName)

                      this.wageService.getWage(tmpData.wageId).subscribe((res) => {
                        if(res) {
                          let tmpData8 = res.wage
                          this.viewEmpForm.get('wageId')?.setValue(tmpData8.wageName)
                        }
                      })
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
}

@Component({
  selector: 'edit-employee-dialog',
  templateUrl: './edit.employee.dialog.html',
  styleUrl: './employee.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatExpansionModule,
    MatDatepickerModule,
    ReactiveFormsModule
  ]
})
export class EditEmployeeDialog implements OnInit {
  editEmpForm: FormGroup
  data = inject(MAT_DIALOG_DATA)
  empId = this.data.id

  clientData: any
  genderOptions: Array<any> = []
  clientOptions: Array<any> = []
  classificationOptions: Array<any> = []
  deptOptions: Array<any> = []
  locOptions: Array<any> = []
  posOptions: Array<any> = []
  empStatusOptions: Array<any> = []
  wageOptions: Array<any> = []

  empService = inject(EmployeeService)
  clientService = inject(ClientService)
  classificationService = inject(ClassificationService)
  deptService = inject(DepartmentService)
  locService = inject(LocationService)
  posService = inject(PositionService)
  empStatService = inject(EmpStatusService)
  wageService = inject(WageService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.editEmpForm = this.fb.group({
      empId: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      suffix: [''],
      gender: [''],
      dateOfBirth: [''],
      education: [''],
      email1: ['', Validators.email],
      email2: ['', Validators.email],
      mobileNum1: [''],
      mobileNum2: [''],
      civilStatus: [''],
      clientId: [0, Validators.required],
      classId: [0, Validators.required],
      deptId: [0, Validators.required],
      locId: [0, Validators.required],
      posId: [0, Validators.required],
      empStatusId: [0, Validators.required],
      wageId: [0, Validators.required],
      remarks: ['']
    })
  }
  ngOnInit(): void {
    this.getEmp(this.empId)
  }

  getEmp(id: number) {
    this.empService.getEmp(id).subscribe((res) => {
      if(res) {
        let tmpData = res.emp

        this.editEmpForm.get('empId')?.setValue(tmpData.empId)
        this.editEmpForm.get('firstName')?.setValue(tmpData.firstName)
        this.editEmpForm.get('middleName')?.setValue(tmpData.middleName)
        this.editEmpForm.get('lastName')?.setValue(tmpData.lastName)
        this.editEmpForm.get('suffix')?.setValue(tmpData.suffix)
        this.editEmpForm.get('gender')?.setValue(tmpData.gender)
        this.editEmpForm.get('dateOfBirth')?.setValue(tmpData.dateOfBirth)
        this.editEmpForm.get('education')?.setValue(tmpData.education)
        this.editEmpForm.get('email1')?.setValue(tmpData.email1)
        this.editEmpForm.get('email2')?.setValue(tmpData.email2)
        this.editEmpForm.get('mobileNum1')?.setValue(tmpData.mobileNum1)
        this.editEmpForm.get('mobileNum2')?.setValue(tmpData.mobileNum2)
        this.editEmpForm.get('civilStatus')?.setValue(tmpData.civilStatus)
        this.editEmpForm.get('classId')?.setValue(tmpData.classId)
        this.editEmpForm.get('deptId')?.setValue(tmpData.deptId)
        this.editEmpForm.get('locId')?.setValue(tmpData.locId)
        this.editEmpForm.get('posId')?.setValue(tmpData.posId)
        this.editEmpForm.get('empStatusId')?.setValue(tmpData.empStatusId)
        this.editEmpForm.get('wageId')?.setValue(tmpData.wageId)
        this.editEmpForm.get('remarks')?.setValue(tmpData.remarks)

        if(this.authService.getToken('userType') == 'Admin') {
          this.clientService.getClients().subscribe((res) => {
            if(res) {
              let tmpData = res.client

              for (let i = 0; i < tmpData.length; i++) {
                let data = {
                  value: tmpData[i].clientId,
                  viewValue: tmpData[i].clientName
                }

                this.clientOptions.push(data)
              }
            }
          })
        }
        else {
          this.clientService.getClient(Number(this.authService.getToken('client'))).subscribe((res) => {
            if(res) {
              let tmpData = res.client

              this.editEmpForm.get('clientId')?.setValue(tmpData.clientName)

              this.classificationService.getClasses().subscribe((res) => {
                if(res) {
                  let tmpData1 = res.classifications

                  for (let i = 0; i < tmpData1.length; i++) {
                    if(tmpData.id == tmpData1[i].clientId) {
                      let data = {
                        value: tmpData1[i].id,
                        viewValue: tmpData1[i].className
                      }

                      this.classificationOptions.push(data)
                    }
                  }

                  this.deptService.getDepts().subscribe((res) => {
                    if(res) {
                      let tmpData2 = res.depts

                      for (let i = 0; i < tmpData2.length; i++) {
                        if(tmpData.id == tmpData2[i].clientId) {
                          let data = {
                            value: tmpData2[i].id,
                            viewValue: tmpData2[i].deptName
                          }

                          this.deptOptions.push(data)
                        }
                      }

                      this.locService.getLocs().subscribe((res) => {
                        if(res) {
                          let tmpData3 = res.locs

                          for(let i = 0; i < tmpData3.length; i++) {
                            for(let j = 0; j < tmpData2.length; j++) {
                              if(tmpData2[j].id == tmpData3[i].deptId) {
                                let data = {
                                  value: tmpData3[i].id,
                                  viewValue: tmpData3[i].locName
                                }

                                this.locOptions.push(data)
                              }
                            }


                            //console.log(this.locOptions)
                          }

                          this.posService.getPositions().subscribe((res) => {
                            if(res) {
                              let tmpData4 = res.positions

                              for (let i = 0; i < tmpData4.length; i++) {
                                if(tmpData.id == tmpData4[i].clientId) {
                                  let data = {
                                    value: tmpData4[i].id,
                                    viewValue: tmpData4[i].posName
                                  }

                                  this.posOptions.push(data)
                                }
                              }

                              console.log(tmpData4)

                              this.empStatService.getEmpStatuses().subscribe((res) => {
                                if(res) {
                                  let tmpData5 = res.empStatuses

                                  for (let i = 0; i < tmpData5.length; i++) {
                                    if(tmpData.id == tmpData5[i].clientId) {
                                      let data = {
                                        value: tmpData5[i].id,
                                        viewValue: tmpData5[i].empStatusName
                                      }

                                      this.empStatusOptions.push(data)
                                    }
                                  }

                                  this.wageService.getWages().subscribe((res) => {
                                    if(res) {
                                      let tmpData6 = res.wages

                                      for (let i = 0; i < tmpData6.length; i++) {
                                        if(tmpData.id == tmpData6[i].clientId) {
                                          let data = {
                                            value: tmpData6[i].id,
                                            viewValue: tmpData6[i].wageName
                                          }

                                          this.wageOptions.push(data)
                                        }
                                      }
                                    }
                                  })
                                }
                              })
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      }
    })
  }

  //admin function only
  onClientChange(clientId: number) {
    this.clientService.getClient(clientId).subscribe((res) => {
      if(res) {
        let tmpData = res.client

        this.classificationService.getClasses().subscribe((res) => {
          if(res) {
            let tmpData1 = res.classifications

            if(this.classificationOptions.length > 0) {
              this.classificationOptions.splice(0, this.classificationOptions.length)
            }

            for (let i = 0; i < tmpData1.length; i++) {
              if(tmpData.id == tmpData1[i].clientId) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].className
                }

                this.classificationOptions.push(data)
              }
            }
          }
        })

        this.deptService.getDepts().subscribe((res) => {
          if(res) {
            let tmpData2 = res.depts

            if(this.deptOptions.length > 0) {
              this.deptOptions.splice(0, this.deptOptions.length)
            }

            for (let i = 0; i < tmpData2.length; i++) {
              if(tmpData.id == tmpData2[i].clientId) {
                let data = {
                  value: tmpData2[i].id,
                  viewValue: tmpData2[i].deptName
                }

                this.deptOptions.push(data)
              }
            }
          }
        })

        this.posService.getPositions().subscribe((res) => {
          if(res) {
            let tmpData3 = res.positions

            if(this.posOptions.length > 0) {
              this.posOptions.splice(0, this.posOptions.length)
            }

            for (let i = 0; i < tmpData3.length; i++) {
              if(tmpData.id == tmpData3[i].clientId) {
                let data = {
                  value: tmpData3[i].id,
                  viewValue: tmpData3[i].posName
                }

                this.posOptions.push(data)
              }
            }
          }
        })

        this.empStatService.getEmpStatuses().subscribe((res) => {
          if(res) {
            let tmpData4 =  res.empStatuses

            if(this.empStatusOptions.length > 0) {
              this.empStatusOptions.splice(0, this.empStatusOptions.length)
            }

            for (let i = 0; i < tmpData4.length; i++) {
              if(tmpData.id == tmpData4[i].clientId) {
                let data = {
                  value: tmpData4[i].id,
                  viewValue: tmpData4[i].empStatusName
                }

                this.empStatusOptions.push(data)
              }
            }
          }
        })

        this.wageService.getWages().subscribe((res) => {
          if(res) {
            let tmpData5 = res.wages

            if(this.wageOptions.length > 0) {
              this.wageOptions.splice(0, this.wageOptions.length)
            }

            for (let i = 0; i < tmpData5.length; i++) {
              if(tmpData.id == tmpData5[i].clientId) {
                let data = {
                  value: tmpData5[i].id,
                  viewValue: tmpData5[i].wageName
                }

                this.wageOptions.push(data)
              }
            }
          }
        })
      }
    })
  }

  onDeptChange(deptId: number) {
    this.deptService.getDept(deptId).subscribe((res) => {
      if(res) {
        let tmpData = res.dept

        this.locService.getLocs().subscribe((res) => {
          if(res) {
            let tmpData1 = res.locs

            if(this.locOptions.length > 0) {
              this.locOptions.splice(0, this.locOptions.length)
            }

            for(let i = 0; i < tmpData1.length; i++) {
              if(tmpData.id == tmpData1[i].deptId) {
                let data = {
                  value: tmpData1[i].id,
                  viewValue: tmpData1[i].locName
                }

                this.locOptions.push(data)
              }
            }
          }
        })
      }
    })
  }

  onEditEmployee(data: any) {
    if(confirm('Are you sure you want to update this employee?')) {
      this.editEmpForm.get('clientId')?.setValue(Number(this.authService.getToken('client')))
      
      this.empService.editEmp(this.empId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Updated Employee',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Updated Employee successfully')
        }
      })
    }
  }
}
