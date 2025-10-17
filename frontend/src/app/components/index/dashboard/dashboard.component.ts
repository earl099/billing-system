import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '@services/user.service';
import { toast } from 'ngx-sonner';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  userService = inject(UserService)
  authService = inject(AuthService)
  dialog = inject(MatDialog)
  userId: string | undefined = ''

  ngOnInit(): void {
    if(this.authService.getToken('userType') != 'Admin') {
      this.getUser()
    }
  }

  getUser() {
    if(this.authService.getToken('client') == undefined) {
      if(this.userService.user()?.role != 'Admin') {
        this.setClient(this.userService.user()?._id)
      }
    }
  }

  setClient(id: string | undefined) {
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
  userService = inject(UserService)
  data = inject(MAT_DIALOG_DATA)
  userId = this.data.id
  userData: Array<number> = []
  clientData: Array<any> = []

  ngOnInit(): void {
    this.getUser(this.userId)
  }

  getUser(id: string) {
    this.userService.getUser(id).subscribe((res) => {
      if(res) {
        let user = res.user
        console.log(user)

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

  onSetClient(id: string) {
    if(confirm('Are you sure you want to handle this client?')) {
      let message = ''

      if(this.authService.getToken('client') == undefined) {
        message = 'Client chosen successfully'
      }
      else {
        message = 'Client changed successfully'
      }
      this.authService.setToken('client', String(id))
      toast.success(message)
    }
  }
}
