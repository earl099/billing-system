/**
 * @fileoverview Admin user detail view component
 * Displays a single user's information including role and assigned clients
 * with navigation to the edit form
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Client } from '@services/client';
import { User } from '@services/user';

@Component({
  selector: 'app-user-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  clients = signal<any[]>([])

  route = inject(ActivatedRoute)
  router = inject(Router)
  clientService = inject(Client)
  userService = inject(User)
  user = signal<any>({})

  /** Loads user data and all clients for resolving client references in the template */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    this.user.set(await this.userService.get(id))
    this.clients.set(await this.clientService.list())
  }

  /** Navigates to the user edit form */
  edit() {
    this.router.navigate(['admin/user', this.user()._id, 'edit'])
  }
}
