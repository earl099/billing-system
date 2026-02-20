import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Billing } from '@services/billing';

@Component({
  selector: 'app-view',
  imports: [...MATERIAL_MODULES, MatIconModule],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  route = inject(ActivatedRoute)
  router = inject(Router)
  billingService = inject(Billing)
  billing = signal<any>({})
  finalFileName = signal<string>('ACID-Billing.pdf')
  code = signal(this.route.snapshot.paramMap.get('code')!)
  createdDate!: Date

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('_id')!
    this.billing.set(await this.billingService.billingDetails(id, this.code()))
    console.log(this.billing())
    this.createdDate = new Date(this.billing().createdAt)
  }

  async downloadFinalPdf() {
    const url = this.billing().finalPdf.secure_url
    if(!url) return

    const res = await fetch(url)
    const blob = await res.blob()

    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)

    a.href = objectUrl
    a.download = this.finalFileName()
    a.click()

    URL.revokeObjectURL(objectUrl)
  }
}
