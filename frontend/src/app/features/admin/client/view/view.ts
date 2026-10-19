/**
 * @fileoverview Admin client detail view component
 * Displays a single client's information including associated pay frequencies
 * with navigation to the edit form
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Client } from '@services/client';
import { Payfreq } from '@services/payfreq';

@Component({
  selector: 'app-client-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit{
  route = inject(ActivatedRoute)
  router = inject(Router)
  clientService = inject(Client)
  payFreqService = inject(Payfreq)
  payFreqs = signal<any[]>([])
  client = signal<any | null>(null)
  loading = signal(true)

  /** Loads client data and all pay frequencies for display */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    try { const [client, payFreqs] = await Promise.all([this.clientService.get(id), this.payFreqService.list()]); this.client.set(client); this.payFreqs.set(payFreqs) } finally { this.loading.set(false) }
  }

  /** Navigates to the client edit form */
  edit() {
    this.router.navigate(['admin/client', this.client()?._id, 'edit'])
  }
}
