import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../services/auth.service';
import { PayFreqService } from '../../../../services/pay.freq.service';
import { LogsService } from '../../../../services/logs.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-pay.freq.list',
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
  templateUrl: './pay.freq.list.component.html',
  styleUrl: './pay.freq.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayFreqListComponent implements OnInit {
  authService = inject(AuthService)
  logsService = inject(LogsService)
  payFreqService = inject(PayFreqService)

  dataSource!: MatTableDataSource<any>
  payFreqs: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['payType', 'actions']

  constructor() { }

  ngOnInit(): void {
    this.getPayFreqs()
  }

  getPayFreqs() {
    this.payFreqService.getPayFreqs().subscribe((res) => {
      if(res) {
        let tmpData = res.payFreqs

        this.dataSource = new MatTableDataSource(tmpData)
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort
      }
    })
  }

  openAddPayFreqDialog() {
    const dialogRef = this.dialog.open(AddPayFreqDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getPayFreqs()
    })
  }
  
  openViewPayFreqDialog(id: number) {

  }

  openEditPayFreqDialog(id: number) {

  }

  delPayFreq(id: number) {

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
  selector: 'add-pay-freq-dialog',
  templateUrl: './add.pay.freq.dialog.html',
  styleUrl: './pay.freq.list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule
  ]
})
export class AddPayFreqDialog implements OnInit {

  constructor() { }
  ngOnInit(): void {

  }
}
