import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Auth } from '@services/auth';
import { Log } from '@services/log';

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
  logService = inject(Log)
  user = signal<any>({})

  async ngOnInit() {
    this.user.set(await this.authService.getProfile())
  }
}
