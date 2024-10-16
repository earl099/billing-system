import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { LogsService } from '../../../../services/logs.service';
import { ClientService } from '../../../../services/client.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-client.list',
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
  templateUrl: './client.list.component.html',
  styleUrl: './client.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  authService = inject(AuthService)
  logsService = inject(LogsService)
  clientService = inject(ClientService)
  toastr = inject(ToastrService)

  dataSource!: MatTableDataSource<any>
  clients: Array<any> = []
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)
  @ViewChild(MatPaginator) paginator !: MatPaginator
  @ViewChild(MatSort) sort !: MatSort
  columns = ['clientName', 'actions']

  constructor() { }

  ngOnInit(): void {
    this.getClients()
  }

  getClients(offset?: number | null, limit?: number | null) {
    if(offset == null && limit == null) {
      this.clientService.getClients().subscribe((res) => {
        if(res) {
          let tmpData = res.clients


          this.dataSource = new MatTableDataSource(tmpData)
          this.dataSource.paginator = this.paginator
          this.dataSource.sort = this.sort
        }
      })
    }
    else {
      this.clientService.getClients(offset, limit).subscribe((res) => {
        if(res) {

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

  openAddClientDialog() {
    
  }

  openViewClientDialog(id: number) {

  }

  openEditClientDialog(id: number) {

  }

  delClient(id: number) {

  }
}
