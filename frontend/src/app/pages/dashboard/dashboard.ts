import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MATERIAL_MODULES } from '@material';
import { Auth } from '@services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [...MATERIAL_MODULES],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  authService = inject(Auth)
  user: any = null

  async ngOnInit() {
    this.user = this.authService.getProfile()
  }

  logout() {
    this.authService.logout()
  }
}
