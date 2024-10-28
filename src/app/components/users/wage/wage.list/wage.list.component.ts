import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { WageService } from '../../../../services/wage.service';

@Component({
  selector: 'app-wage.list',
  standalone: true,
  imports: [
    CommonModule,
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

  }

  openViewWageDialog(id: number) {

  }

  openEditWageDialog(id: number) {

  }

  delWage(id: number) {
    
  }
}
