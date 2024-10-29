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
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['wageName', 'actions']

  ngOnInit(): void {
    this.getWages()
  }

  getWages(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.wageService.getWages().subscribe((res) => {
        if(res) {
          let tmpData = res.wages

          this.dataSource = new MatTableDataSource(tmpData)
          this.dataSource.paginator = this.paginator
          this.dataSource.sort = this.sort
        }
      })
    }
    else {
      this.wageService.getWages(offset, limit).subscribe((res) => {
        if(res) {
          let tmpData = res.rows

          this.dataSource = new MatTableDataSource(tmpData)
          this.dataSource.paginator = this.paginator
          this.dataSource.paginator.length = res.count
          this.dataSource.sort = this.sort
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
  statusOptions: Array<any> = []

  wageService = inject(WageService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  constructor() {
    this.addWageForm = this.fb.group({
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

  data = inject(MAT_DIALOG_DATA)
  wageId = this.data.id
  fb  = inject(FormBuilder)
  viewWageForm: FormGroup

  constructor() {
    this.viewWageForm = this.fb.group({
      wageName: [''],
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

        this.viewWageForm.get('wageName')?.setValue(tmpData.wageName)
        this.viewWageForm.get('description')?.setValue(tmpData.description)
        this.viewWageForm.get('status')?.setValue(tmpData.status)
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
  authService = inject(AuthService)
  logsService = inject(LogsService)
  toastr = inject(ToastrService)

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

  constructor() {
    this.editWageForm = this.fb.group({
      wageName: ['', Validators.required],
      description: [''],
      status: ['', Validators.required]
    })
  }
  ngOnInit(): void {
    this.getWage(this.wageId)
  }

  getWage(id: number) {
    this.wageService.getWage(id).subscribe((res) => {
      if(res) {
        let tmpData = res.wage

        this.editWageForm.get('wageName')?.setValue(tmpData.wageName)
        this.editWageForm.get('description')?.setValue(tmpData.description)
        this.editWageForm.get('status')?.setValue(tmpData.status)
      }
    })
  }

  onEditWage(data: any) {
    if(confirm('Are you sure you want to edit this wage?')) {
      this.wageService.editWage(this.wageId, data.value).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Edited Wage',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Edited Wage Successfully')
        }
      })
    }
  }
}
