import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { LogsService } from '../../services/logs.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { SetClientDialog } from '../../components/index/dashboard/dashboard.component';
import { UserService } from '@services/user.service';
import { catchError, tap } from 'rxjs';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatExpansionModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent implements OnInit, OnDestroy {
  router = inject(Router)
  authService = inject(AuthService)
  userService = inject(UserService)
  logsService = inject(LogsService)
  changeDetectorRef = inject(ChangeDetectorRef)
  media = inject(MediaMatcher)
  dialog = inject(MatDialog)
  mobileQuery: MediaQueryList
  userId: string | undefined = ''
  private _mobileQueryListener: () => void

  constructor() {
    this.mobileQuery = this.media.matchMedia('(max-width: 640px)')
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges()
    this.mobileQuery.addEventListener('resize', this._mobileQueryListener)
  }

  ngOnInit(): void {
    if(this.authService.getToken('userType') == 'User') {
      this.getUser()
    }
  }

  getUser() {
    this.userService.getUsers().subscribe((res) => {
      if(res) {
        let tmpData = res

        for (let i = 0; i < tmpData.length; i++) {
          if((tmpData[i].username == this.authService.getToken('user') ||
            tmpData[i].email == this.authService.getToken('user')
            ) && tmpData[i].role != 'Admin') {
              this.userId = tmpData[i]._id
          }
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('resize', this._mobileQueryListener)
  }

  setClient(id: string | undefined) {
    let dialogRef = this.dialog.open(SetClientDialog, { data: { id }})

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/dashboard'])
    })

  }

  onLogout() {
    //clear localstorage and redirect to home
    this.authService.logout().pipe(
      tap(() => console.log('Logging out...')),
      catchError(async (_err) => toast.error('Error Logging out')),
      tap(() => {
        const logData = {
          operation: 'Account Logged Out',
          user: this.authService.getToken('user')
        }
        this.logsService.addLog(logData).subscribe((res) => {
          if(res) {
            this.authService.deleteToken()
            toast.success('Logged out successfully.')
            this.router.navigate(['/home'])
          }
        })
      })
    ).subscribe()
    

  }
}
