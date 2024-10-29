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
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  columns = ['deptName', 'deptsId', 'actions']
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

  }

  openViewLocDialog(id: number) {

  }

  openEditLocDialog(id: number) {

  }

  delLoc(id: number) {

  }
}

@Component({
  selector: 'add-location-dialog',
  templateUrl: './add.location.dialog.html',
  styleUrl: './location.list.component.scss',
  standalone: true,
  imports: [

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
        
      }
    })
  }

}

