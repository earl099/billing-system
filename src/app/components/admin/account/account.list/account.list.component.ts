import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatGridListModule } from '@angular/material/grid-list';
import { AuthService } from '../../../../services/auth.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LogsService } from '../../../../services/logs.service';
import { ToastrService } from 'ngx-toastr';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-account.list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginator,
    MatSort,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './account.list.component.html',
  styleUrl: './account.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent implements OnInit {
  //toastr service for notification
  toastr = inject(ToastrService)

  //table data source
  dataSource !: MatTableDataSource<any>
  //user list
  users: Array<any> = []
  //table columns
  columns: string[] = [
    'username',
    'email',
    'userType',
    'actions'
  ]

  //paginator and sort
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort

  //services and modules needed for opening dialogs, adding logs and sorting
  logsService = inject(LogsService)
  authService = inject(AuthService)
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)

  constructor() { }

  ngOnInit(): void {
    this.getUsers()
  }

  //get users for initializing of data
  getUsers() {
    this.authService.getUsers().subscribe((res) => {
      if(res) {
        let tmpData = res.users

        for (let i = 0; i < tmpData.length; i++) {
          this.users.push(tmpData[i])
        }

        this.dataSource = new MatTableDataSource(this.users)
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort
        //console.log(this.dataSource.data)
      }
    })
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

  //function for opening edit detail dialog
  openDetailDialog(data: any) {
    //console.log(data)
    const dialogRef = this.dialog.open(EditDetailsDialog, {
      data: {
        id: data
      }
    })
    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getUsers()
    })
  }

  //function for opening edit access dialog
  openAccessDialog(data: any) {
    const dialogRef = this.dialog.open(EditAccessDialog, {
      data: {
        id: data
      }
    })
    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getUsers()
    })
  }

  //function to open view account dialog
  openViewUserDialog(data: any) {
    const dialogRef = this.dialog.open(ViewUserDialog, {
      data: {
        id: data
      }
    })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getUsers()
    })
  }

  //delete function for user
  delUser(id: number) {
    if(confirm('Are you sure you want to delete this data?')) {
      let logData = {
        operation: 'Deleted User',
        user: this.authService.getToken('user')
      }

      this.authService.deleteUser(Number(id)).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe((res) => {
            if(res) {
              this.toastr.success('Account deleted successfully.')
              this.dataSource.data.splice(0, this.dataSource.data.length)
              this.getUsers()
            }
          })
        }
      })
    }
  }
}

//** EDIT DETAILS DIALOG COMPONENT **//
@Component({
  selector: 'edit-details-dialog',
  templateUrl: './edit.details.dialog.html',
  styleUrl: './account.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatGridListModule,
    ReactiveFormsModule
  ]
})
export class EditDetailsDialog implements OnInit {
  editDetailForm : FormGroup
  data = inject(MAT_DIALOG_DATA)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  userId = this.data.id


  constructor(
    private fb: FormBuilder
  ) {
    this.editDetailForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      userType: ['']
    })
  }

  ngOnInit(): void {
    this.getUser()
  }

  getUser() {
    this.authService.getUser(this.userId).subscribe((res) => {
      if(res) {
        let tmpData = res.user
        //console.log(tmpData)
        this.editDetailForm.get('username')?.setValue(tmpData.username)
        this.editDetailForm.get('email')?.setValue(tmpData.email)
        this.editDetailForm.get('password')?.setValue(tmpData.password)
        this.editDetailForm.get('userType')?.setValue(tmpData.userType)

        //console.log(this.editDetailForm.value)
      }
    })
  }

  onEditDetails(data: any) {
    if(confirm('Are you sure you want to edit the details?')) {
      //console.log(data.value)
      this.authService.editDetails(Number(this.userId), data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Edited User Data',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()

          this.toastr.success('Edited Data Successfully.')
        }
      })
    }
  }
}

//** EDIT ACCESS DIALOG COMPONENT **//
@Component({
  selector: 'edit-access-dialog',
  templateUrl: './edit.access.dialog.html',
  styleUrl: './account.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatExpansionModule
  ]
})
export class EditAccessDialog implements OnInit {
  editAccessForm: FormGroup
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  data = inject(MAT_DIALOG_DATA)
  userId = this.data.id

  options = [
    {
      value: 1,
      viewValue: 'Yes'
    },
    {
      value: 0,
      viewValue: 'No'
    }
  ]

  constructor(private fb: FormBuilder) {
    this.editAccessForm = this.fb.group({
      viewAcct: [0, Validators.required],
      addAcct: [0, Validators.required],
      editAcct: [0, Validators.required],
      delAcct: [0, Validators.required],

      viewPayF: [0, Validators.required],
      addPayF: [0, Validators.required],
      editPayF: [0, Validators.required],
      delPayF: [0, Validators.required],

      viewClient: [0, Validators.required],
      addClient: [0, Validators.required],
      editClient: [0, Validators.required],
      delClient: [0, Validators.required],

      viewEmp: [0, Validators.required],
      addEmp: [0, Validators.required],
      editEmp: [0, Validators.required],
      delEmp: [0, Validators.required],

      viewClass: [0, Validators.required],
      addClass: [0, Validators.required],
      editClass: [0, Validators.required],
      delClass: [0, Validators.required],

      viewDept: [0, Validators.required],
      addDept: [0, Validators.required],
      editDept: [0, Validators.required],
      delDept: [0, Validators.required],

      viewPos: [0, Validators.required],
      addPos: [0, Validators.required],
      editPos: [0, Validators.required],
      delPos: [0, Validators.required],

      viewLoc: [0, Validators.required],
      addLoc: [0, Validators.required],
      editLoc: [0, Validators.required],
      delLoc: [0, Validators.required],

      viewWage: [0, Validators.required],
      addWage: [0, Validators.required],
      editWage: [0, Validators.required],
      delWage: [0, Validators.required],
    })
  }

  ngOnInit(): void {
    this.getUser(this.userId)
  }

  getUser(id: number) {
    this.authService.getUser(id).subscribe((res) => {
      if(res) {
        let tmpData = res.user
        this.editAccessForm.get('viewAcct')?.setValue(tmpData.viewAcct),
        this.editAccessForm.get('addAcct')?.setValue(tmpData.addAcct),
        this.editAccessForm.get('editAcct')?.setValue(tmpData.editAcct),
        this.editAccessForm.get('delAcct')?.setValue(tmpData.delAcct),

        this.editAccessForm.get('viewPayF')?.setValue(tmpData.viewPayF),
        this.editAccessForm.get('addPayF')?.setValue(tmpData.addPayF),
        this.editAccessForm.get('editPayF')?.setValue(tmpData.editPayF),
        this.editAccessForm.get('delPayF')?.setValue(tmpData.delPayF),

        this.editAccessForm.get('viewClient')?.setValue(tmpData.viewClient),
        this.editAccessForm.get('addClient')?.setValue(tmpData.addClient),
        this.editAccessForm.get('editClient')?.setValue(tmpData.editClient),
        this.editAccessForm.get('delClient')?.setValue(tmpData.delClient),

        this.editAccessForm.get('viewEmp')?.setValue(tmpData.viewEmp),
        this.editAccessForm.get('addEmp')?.setValue(tmpData.addEmp),
        this.editAccessForm.get('editEmp')?.setValue(tmpData.editEmp),
        this.editAccessForm.get('delEmp')?.setValue(tmpData.delEmp),

        this.editAccessForm.get('viewClass')?.setValue(tmpData.viewClass),
        this.editAccessForm.get('addClass')?.setValue(tmpData.addClass),
        this.editAccessForm.get('editClass')?.setValue(tmpData.editClass),
        this.editAccessForm.get('delClass')?.setValue(tmpData.delClass),

        this.editAccessForm.get('viewDept')?.setValue(tmpData.viewDept),
        this.editAccessForm.get('addDept')?.setValue(tmpData.addDept),
        this.editAccessForm.get('editDept')?.setValue(tmpData.editDept),
        this.editAccessForm.get('delDept')?.setValue(tmpData.delDept),

        this.editAccessForm.get('viewPos')?.setValue(tmpData.viewPos),
        this.editAccessForm.get('addPos')?.setValue(tmpData.addPos),
        this.editAccessForm.get('editPos')?.setValue(tmpData.editPos),
        this.editAccessForm.get('delPos')?.setValue(tmpData.delPos),

        this.editAccessForm.get('viewLoc')?.setValue(tmpData.viewLoc),
        this.editAccessForm.get('addLoc')?.setValue(tmpData.addLoc),
        this.editAccessForm.get('editLoc')?.setValue(tmpData.editLoc),
        this.editAccessForm.get('delLoc')?.setValue(tmpData.delLoc),

        this.editAccessForm.get('viewWage')?.setValue(tmpData.viewWage),
        this.editAccessForm.get('addWage')?.setValue(tmpData.addWage),
        this.editAccessForm.get('editWage')?.setValue(tmpData.editWage),
        this.editAccessForm.get('delWage')?.setValue(tmpData.delWage)

        console.log(this.editAccessForm.value)
      }
    })
  }

  onEditAccess(data: any) {
    if(confirm('Are you sure you want to change the access of this user?')) {
      this.authService.editAccess(this.userId, data.value).subscribe((res) => {
        if(res) {
          let logdata = {
            operation: 'Edited User Access',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logdata).subscribe((res) => {
            if(res) {
              this.toastr.success('Access edited successfully.')
            }
          })
        }
      })
    }
  }
}

@Component({
  selector: 'view-user-dialog',
  templateUrl: './view.account.dialog.html',
  styleUrl: './account.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatGridListModule,
    ReactiveFormsModule
  ]
})
export class ViewUserDialog implements OnInit {
  viewAccountForm : FormGroup
  data = inject(MAT_DIALOG_DATA)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  userId = this.data.id


  constructor(
    private fb: FormBuilder
  ) {
    this.viewAccountForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      userType: ['']
    })
  }

  ngOnInit(): void {
    this.getUser()
  }

  getUser() {
    this.authService.getUser(this.userId).subscribe((res) => {
      if(res) {
        let tmpData = res.user
        //console.log(tmpData)
        this.viewAccountForm.get('username')?.setValue(tmpData.username)
        this.viewAccountForm.get('email')?.setValue(tmpData.email)
        this.viewAccountForm.get('password')?.setValue(tmpData.password)
        this.viewAccountForm.get('userType')?.setValue(tmpData.userType)

        //console.log(this.editDetailForm.value)
      }
    })
  }
}
