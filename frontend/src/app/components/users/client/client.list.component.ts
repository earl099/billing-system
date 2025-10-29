import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Client } from '@models/client';
import { ClientService } from '@services/client.service';
import { LogsService } from '@services/logs.service';
import { UserService } from '@services/user.service';
import { toast } from 'ngx-sonner';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-client',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
],
  templateUrl: './client.list.component.html',
  styleUrl: './client.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientComponent implements OnInit { 
  //table data source
  dataSource !: MatTableDataSource<any>
  
  clients: Client[] = []
  
  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort !: MatSort

  logService = inject(LogsService)
  clientService = inject(ClientService)
  columns: string[] = [
    'code',
    'name',
    'actions'
  ]

  //services and modules needed for opening dialogs, adding logs and sorting
  logsService = inject(LogsService)
  userService = inject(UserService)
  dialog = inject(MatDialog)
  _liveAnnouncer = inject(LiveAnnouncer)

  ngOnInit(): void {
      this.getClients()
  }

  getClients() {
    this.clientService.getClients().subscribe((res) => {
      if(res) {
        console.log(res)
      }
    })
  }

  openAddClientDialog() {

  }

  openViewClientDialog(_id: string) {

  }

  openUpdateClientDialog(_id: string) {

  }

  onDeleteClient(_id: string) {

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
}

// ADD CLIENT COMPONENT
@Component({
  selector: 'add-client-dialog',
  templateUrl: './client.add.dialog.html',
  styleUrl: './client.list.component.scss',
  imports: []
})
export class AddClientDialog {
  constructor() {

  }
}

// VIEW CLIENT COMPONENT
@Component({
  selector: 'view-client-dialog',
  templateUrl: './client.view.dialog.html',
  styleUrl: './client.list.component.scss',
  imports: []
})
export class ViewClientDialog implements OnInit {
  ngOnInit(): void {
      
  }

}

//UPDATE CLIENT DIALOG
@Component({
  selector: 'update-client-dialog',
  templateUrl: './client.update.dialog.html',
  styleUrl: './client.list.component.scss',
  imports: []
})
export class UpdateClientDialog implements OnInit {
  ngOnInit(): void {
      
  }
}
