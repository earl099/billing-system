/**
 * @fileoverview Admin user detail view component
 * Displays a single user's information including role and assigned clients
 * with navigation to the edit form
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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
  user = signal<any | null>(null)
  loading = signal(true)
  handledClientNames = computed(() => {
    const handledClientIds = new Set(this.user()?.handledClients ?? [])
    return this.clients()
      .filter((client) => handledClientIds.has(client._id))
      .map((client) => client.code)
  })

  /** Loads user data and all clients for resolving client references in the template */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) {
      this.loading.set(false)
      return
    }

    try {
      const [user, clients] = await Promise.all([
        this.userService.get(id),
        this.clientService.list(),
      ])
      this.user.set(user)
      this.clients.set(clients)
    } finally {
      this.loading.set(false)
    }
  }

  /** Navigates to the user edit form */
  edit() {
    const userId = this.user()?._id
    if (userId) {
      this.router.navigate(['admin/user', userId, 'edit'])
    }
  }

  /** Returns to the account list. */
  backToUsers() {
    this.router.navigate(['/admin/user/list'])
  }
}
