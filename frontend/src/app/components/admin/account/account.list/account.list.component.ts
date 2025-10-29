import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LogsService } from '../../../../services/logs.service';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@services/user.service';
import { User } from '@models/user';
import { Log } from '@models/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-account.list',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './account.list.component.html',
  styleUrl: './account.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent implements OnInit {
  //table data source
  dataSource !: MatTableDataSource<any>
  //user list
  users: Array<any> = []
  //table columns
  columns: string[] = [
    'username',
    'email',
    'role',
    'actions'
  ]

  //paginator and sort
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort

  //services and modules needed for opening dialogs, adding logs and sorting
  logsService = inject(LogsService)
  userService = inject(UserService)
  dialog = inject(MatDialog)

  ngOnInit(): void {
    this.getUsers()
  }

  //get users for initializing of data
  getUsers() {
    this.userService.getUsers().subscribe((res) => {
      if(res) {
        let tmpData = res.users
        
        for (let i = 0; i < tmpData.length; i++) {
          this.users.push(tmpData[i])
        }

        this.dataSource = new MatTableDataSource(this.users)
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort
        toast.success('Accounts retrieved')
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
      toast.info(`Sorted in ${sortState.direction} order`)
    } else {
      toast.info(`Sorting cleared`)
    }
  }

  //function to open view account dialog
  openUpdateUserDialog(data: any) {
    const dialogRef = this.dialog.open(EditDetailsDialog, {
      data: {
        _id: data
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
        _id: data
      }
    })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getUsers()
    })
  }

  //delete function for user
  delUser(id: string | undefined) {
    if(confirm('Are you sure you want to delete this data?')) {
      let logData: Log = {
        operation: 'Deleted User',
        user: this.userService.user()?.username ?? ''
      }

      this.userService.deleteUser(id).subscribe((res) => {
        if(res) {
          this.logsService.addLog(logData).subscribe((res) => {
            if(res) {
              toast.success('Account deleted successfully.')
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
  imports: [
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
  userService = inject(UserService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  userId: string | undefined = this.data._id

  constructor(
    private fb: FormBuilder
  ) {
    this.editDetailForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      role: ['', Validators.required],
      handledClients: [[]],
    })
  }

  ngOnInit(): void {
    this.getUser()
  }

  getUser() {
    this.userService.getUser(this.userId).subscribe((res) => {
      if(res) {
        let tmpData = res.user
        //console.log(tmpData)
        this.editDetailForm.get('username')?.setValue(tmpData.username)
        this.editDetailForm.get('email')?.setValue(tmpData.email)
        this.editDetailForm.get('password')?.setValue(tmpData.password)
        this.editDetailForm.get('role')?.setValue(tmpData.role)
        this.editDetailForm.get('handledClients')?.setValue(tmpData.handledClients)
        //console.log(this.editDetailForm.value)
      }
    })
  }

  onEditDetails(data: any) {
    if(confirm('Are you sure you want to edit the details?')) {
      //console.log(data.value)

      let userData: User = {
        username: data.value.username,
        email: data.value.email,
        password: data.value.password,
        role: data.value.role,
        handledClients: data.value.handledClients
      }
      
      this.userService.updateUser(this.userId, userData).subscribe((res) => {
        if(res) {
          let logData: Log = {
            operation: 'Updated User Data',
            user: this.userService.user()?.username ?? ''
          }

          this.logsService.addLog(logData).subscribe()

          this.toastr.success('Edited Data Successfully.')
        }
      })
    }
  }
}


@Component({
  selector: 'view-user-dialog',
  templateUrl: './view.account.dialog.html',
  styleUrl: './account.list.component.scss',
  imports: [
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
  userService = inject(UserService)
  toastr = inject(ToastrService)
  userId = this.data._id


  constructor(
    private fb: FormBuilder
  ) {
    this.viewAccountForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      role: ['']
    })
  }

  ngOnInit(): void {
    this.getUser()
  }

  getUser() {
    this.userService.getUser(this.userId).subscribe((res) => {
      if(res) {
        let tmpData = res.user
        
        this.viewAccountForm.get('username')?.setValue(tmpData.username)
        this.viewAccountForm.get('email')?.setValue(tmpData.email)
        this.viewAccountForm.get('password')?.setValue(tmpData.password)
        this.viewAccountForm.get('role')?.setValue(tmpData.role)

        //console.log(this.editDetailForm.value)
      }
    })
  }
}
