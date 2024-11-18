import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService)
  dialog = inject(MatDialog)
  toastr = inject(ToastrService)
  userId = 0

  ngOnInit(): void {
    if(this.authService.getToken('userType') != 'Admin') {
      this.getUser()
    }
  }

  getUser() {
    if(this.authService.getToken('client') == undefined) {
      this.authService.getUsers().subscribe((res) => {
        if(res) {
          let tmpData = res.users

          for (let i = 0; i < tmpData.length; i++) {
            if(
              (tmpData[i].username == this.authService.getToken('user') ||
                tmpData.email == this.authService.getToken('user')
              ) && tmpData[i].userType != 'Admin') {
                this.userId = tmpData[i].id
                this.setClient(this.userId)
            }

          }
        }
      })
    }
  }

  setClient(id: number) {
    this.dialog.open(SetClientDialog, { data: { id }, disableClose: true })
  }
}

@Component({
  selector: 'set-client-dialog',
  templateUrl: './set.client.dialog.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class SetClientDialog implements OnInit {
  authService = inject(AuthService)
  clientService = inject(ClientService)
  toastrService = inject(ToastrService)
  data = inject(MAT_DIALOG_DATA)
  userId = this.data.id
  userData: Array<number> = []
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getUser(this.userId)
  }

  getUser(id: number) {
    this.authService.getUser(id).subscribe((res) => {
      if(res) {
        let user = res.user

        this.clientService.getClients().subscribe((res) => {
          if(res) {
            let clients = res.clients

            let handledClients = String(user.viewClient).split('.')
            for(let i = 0; i < handledClients.length; i++) {
              let clientIds = Number(handledClients[i])
              this.userData.push(clientIds)
            }

            for(let i = 0; i < clients.length; i++) {
              for (let j = 0; j < this.userData.length; j++) {
                if(clients[i].id == this.userData[j]) {
                  let data = {
                    value: this.userData[j],
                    viewValue: clients[i].clientName
                  }

                  this.clientData.push(data)
                }
              }
            }
          }
        })
      }
    })
  }

  toNumber(): number {
    if(this.authService.getToken('client') == undefined) {
      return 0
    }
    else {
      return Number(this.authService.getToken('client'))
    }
  }

  onSetClient(id: number) {
    if(confirm('Are you sure you want to handle this client?')) {
      let message = ''

      if(this.authService.getToken('client') == undefined) {
        message = 'Client chosen successfully'
      }
      else {
        message = 'Client changed successfully'
      }
      this.authService.setToken('client', String(id))
      this.toastrService.success(message)
    }
  }
}
