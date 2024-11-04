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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ClassificationService } from '../../../../services/classification.service';
import { PositionService } from '../../../../services/position.service';
import { EmpStatusService } from '../../../../services/emp.status.service';
import { WageService } from '../../../../services/wage.service';

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
  deptService = inject(DepartmentService)
  locService = inject(LocationService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  deptData: Array<any> = []
  locData: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['employeeId', 'empName', 'deptName', 'locName']

  ngOnInit(): void {
    this.getEmps()
  }

  getEmps(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
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

  }

  openViewEmpDialog(id: number) {

  }

  openEditEmpDialog(id: number) {

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
    ReactiveFormsModule
  ]
})
export class AddEmployeeDialog {
  addEmpForm: FormGroup
  clientOptions: Array<any> = []
  classificationOptions: Array<any> = []
  deptOptions: Array<any> = []
  locOptions: Array<any> = []
  posOptions: Array<any> = []
  empStatusOptions: Array<any> = []
  wageOptions: Array<any> = []

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
      employeeId: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      suffix: [''],
      gender: [''],
      dateOfBirth: [''],
      education: [''],
      email1: [''],
      email2: [''],
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

  onClientChange(clientId: number) {

  }

  onDeptChange(deptId: number) {

  }
}

@Component({
  selector: 'view-employee-dialog',
  templateUrl: './view.employee.dialog.html',
  styleUrl: './employee.list.component.scss',
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
export class ViewEmployeeDialog implements OnInit {

  constructor() { }
  ngOnInit(): void { }
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
    ReactiveFormsModule
  ]
})
export class EditEmployeeDialog implements OnInit {

  constructor() { }
  ngOnInit(): void { }
}
