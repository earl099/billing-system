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
  client = signal<any>({})

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    this.client.set(await this.clientService.get(id))
    this.payFreqs.set(await this.payFreqService.list())
  }

  edit() {
    this.router.navigate(['admin/client', this.client()._id, 'edit'])
  }
}
