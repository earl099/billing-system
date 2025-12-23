import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Auth } from '@services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [
    ...MATERIAL_MODULES,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  authService = inject(Auth)
  user = signal<any>({})

  async ngOnInit() {
    this.user.set(await this.authService.getProfile())
  }

  logout() {
    this.authService.logout()
  }
}
