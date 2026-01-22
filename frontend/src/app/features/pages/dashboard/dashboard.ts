import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';

@Component({
  selector: 'app-dashboard',
  imports: [
    ...MATERIAL_MODULES,
    MatExpansionModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  user = signal<any>({})
  clients = signal<any>({})

  async ngOnInit() {
    this.user.set(await this.authService.getProfile())
    console.log(this.user())
    this.clients.set(await this.clientService.allList())
    console.log(this.clients())
  }
}
