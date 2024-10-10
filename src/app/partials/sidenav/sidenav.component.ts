import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { HomeComponent } from '../../components/index/home/home.component';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { LogsService } from '../../services/logs.service';

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
    HomeComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent implements OnDestroy {
  router = inject(Router)
  authService = inject(AuthService)
  logsService = inject(LogsService)
  changeDetectorRef = inject(ChangeDetectorRef)
  media = inject(MediaMatcher)
  mobileQuery: MediaQueryList

  private _mobileQueryListener: () => void

  constructor(private toastr: ToastrService) {
    this.mobileQuery = this.media.matchMedia('(max-width: 640px)')
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges()
    this.mobileQuery.addEventListener('resize', this._mobileQueryListener)
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('resize', this._mobileQueryListener)
  }


  onLogout() {
    //clear localstorage and redirect to home
    const logData = {
      operation: 'Account Logged Out',
      user: this.authService.getToken('user')
    }
    this.logsService.addLog(logData).subscribe((res) => {
      if(res) {
        this.authService.deleteToken()
        this.toastr.success('Logged out successfully.')
        this.router.navigate(['/home'])
      }
    })

  }
}
