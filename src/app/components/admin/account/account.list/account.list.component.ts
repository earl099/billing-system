import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../../services/auth.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

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
    'userType',
    'editDetails',
    'editAccess'
  ]
  //paginator

  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort

  constructor(
    private authService: AuthService,
    private _liveAnnouncer: LiveAnnouncer,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.getUsers()
  }

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
  openDetailDialog() {
    const dialogRef = this.dialog.open(EditDetailsDialog)
    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getUsers()
    })
  }

  openAccessDialog() {
    const dialogRef = this.dialog.open(EditAccessDialog)
    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      //this.getUsers()
    })
  }
}

//** EDIT DETAILS DIALOG COMPONENT **//
@Component({
  selector: 'edit-details-dialog',
  templateUrl: './edit.details.dialog.html',
  styleUrl: './account.list.component.scss',
  standalone: true,
  imports: [
    MatCardModule
  ]
})
export class EditDetailsDialog implements OnInit {
  constructor() {}

  ngOnInit(): void {

  }
}

//** EDIT ACCESS DIALOG COMPONENT **//
@Component({
  selector: 'edit-access-dialog',
  templateUrl: './edit.access.dialog.html',
  styleUrl: './account.list.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule
  ]
})
export class EditAccessDialog implements OnInit {
  ngOnInit(): void {

  }
}
