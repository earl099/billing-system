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
    const dialogRef = this.dialog.open(ViewClientDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getClients()
    })
  }

  openEditClientDialog(id: number) {
    const dialogRef = this.dialog.open(EditClientDialog, { data: { id } })

    dialogRef.afterClosed().subscribe(() => {
      this.dataSource.data.splice(0, this.dataSource.data.length)
      this.getClients()
    })
  }

  delClient(id: number) {
    if(confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(id).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Deleted Client',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Deleted client successfully')

          this.dataSource.data.splice(0, this.dataSource.data.length)
          this.getClients()
        }
      })
    }
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
  payFreqOptions: Array<any> = []

  clientService = inject(ClientService)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  payFreqService = inject(PayFreqService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

  statusOptions = [
    {
      value: 'Active',
      viewValue: 'Active'
    },
    {
      value: 'Inactive',
      viewValue: 'Inactive'
    }
  ]

  constructor() {
    this.addClientForm = this.fb.group({
      clientCode: ['', Validators.required],
      clientName: ['', Validators.required],
      payFreqId: [0, Validators.required],
      description: [''],
      status: ['', Validators.required]
    })

    this.payFreqService.getPayFreqs().subscribe((res) => {
      let tmpData = res.payFreqs

      for (let i = 0; i < tmpData.length; i++) {
        let data = {
          value: tmpData[i].id,
          viewValue: tmpData[i].payType
        }

        this.payFreqOptions.push(data)
      }

      //console.log(this.payFreqOptions)
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

@Component({
  selector: 'view-client-dialog',
  templateUrl: './view.client.dialog.html',
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
export class ViewClientDialog implements OnInit {
  clientService = inject(ClientService)
  payFreqService = inject(PayFreqService)
  fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA)
  clientId = this.data.id
  viewClientForm: FormGroup

  constructor() {
    this.viewClientForm = this.fb.group({
      clientCode: [''],
      clientName: [''],
      payFreqId: [''],
      description: [''],
      status: [''],
    })
  }
  ngOnInit(): void {
    this.getClient(this.clientId)
  }

  getClient(id: number) {
    this.clientService.getClient(Number(id)).subscribe((res) => {
      let tmpData = res.client
      this.payFreqService.getPayFreq(Number(tmpData.payFreqId)).subscribe((res) => {
        let tmpData1 = res.payFreq
        this.viewClientForm.get('clientCode')?.setValue(tmpData.clientCode)
        this.viewClientForm.get('clientName')?.setValue(tmpData.clientName)
        this.viewClientForm.get('description')?.setValue(tmpData.description)
        let status = tmpData.status == 'active' ? 'Active':'Inactive'
        this.viewClientForm.get('status')?.setValue(status)
        this.viewClientForm.get('payFreqId')?.setValue(tmpData1.payType)
      })
    })
  }
}

@Component({
  selector: 'edit-client-dialog',
  templateUrl: './edit.client.dialog.html',
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
export class EditClientDialog implements OnInit {
  data = inject(MAT_DIALOG_DATA)
  editClientForm: FormGroup
  clientId = this.data.id

  clientService = inject(ClientService)
  payFreqService = inject(PayFreqService)
  logsService = inject(LogsService)
  authService = inject(AuthService)
  toastr = inject(ToastrService)
  fb = inject(FormBuilder)

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
  payFreqOptions: Array<any> = []


  constructor() {
    this.editClientForm = this.fb.group({
      clientCode: ['', Validators.required],
      clientName: ['', Validators.required],
      payFreqId: [0, Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required]
    })
  }
  ngOnInit(): void {
    this.getClient(this.clientId)
  }

  getClient(id: number) {
    this.clientService.getClient(Number(id)).subscribe((res) => {
      let tmpData = res.client
      this.payFreqService.getPayFreqs().subscribe((res) => {
        let tmpData1 = res.payFreqs
        for(let i = 0; i < tmpData1.length; i++) {
          let data = {
            value: tmpData1.id,
            viewValue: tmpData1.payType
          }

          this.payFreqOptions.push(data)
        }

        this.editClientForm.get('clientCode')?.setValue(tmpData.clientCode)
        this.editClientForm.get('clientName')?.setValue(tmpData.clientName)
        this.editClientForm.get('payFreqId')?.setValue(tmpData.payFreqId)
        this.editClientForm.get('description')?.setValue(tmpData.description)
        this.editClientForm.get('status')?.setValue(tmpData.status)
      })
    })
  }

  onEditClient(data: any) {
    if(confirm('Are you sure you want to edit this client?')) {
      this.clientService.editClient(data.value, this.clientId).subscribe((res) => {
        if(res) {
          let logData = {
            operation: 'Edited Client Details',
            user: this.authService.getToken('user')
          }

          this.logsService.addLog(logData).subscribe()
          this.toastr.success('Edited client successfully.')
        }
      })
    }
  }
}
