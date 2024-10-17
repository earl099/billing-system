import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild, type OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PayFreqService } from '../../../../services/pay.freq.service';
import { MatSelectModule } from '@angular/material/select';

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
  columns = ['clientCode', 'clientName', 'actions']

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
          let tmpData = res.rows

          this.dataSource = new MatTableDataSource(tmpData)
          this.dataSource.paginator = this.paginator
          this.dataSource.sort = this.sort
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
    const dialogRef = this.dialog.open(AddClientDialog)

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getClients()
    })
  }

  openViewClientDialog(id: number) {

  }

  openEditClientDialog(id: number) {

  }

  delClient(id: number) {

  }
}

@Component({
  selector: 'add-client-dialog',
  templateUrl: './add.client.dialog.html',
  styleUrl: './client.list.component.scss',
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
export class AddClientDialog implements OnInit {
  addClientForm: FormGroup
  payFreqOptions: any

  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  payFreqService = inject(PayFreqService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)



  constructor() {
    this.addClientForm = this.fb.group({
      clientCode: ['', Validators.required],
      clientName: ['', Validators.required],
      payFreqId: [0, Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required]
    })

    this.payFreqService.getPayFreqs().subscribe((res) => {
      this.payFreqOptions = res.payFreqs
    })
  }

  ngOnInit(): void { }

  onAddClient(data: any) {
    if(confirm('Are you sure you want to add this client?')) {
      let logData = {
        operation: 'Added Client',
        user: this.authService.getToken('user')
      }

      this.clientService.addClient(data.value).subscribe((res) => {
        this.logsService.addLog(logData).subscribe()
        this.toastr.success('Added client successfully')
      })

    }
  }
}
