/**
 * @fileoverview Billing rate detail view component
 * Displays a single billing rate's information in a read-only card layout
 * with navigation to edit form and back to list
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, Router } from '@angular/router'
import { MATERIAL_MODULES } from '@material'
import { BillingRate } from '@models/billing-rate'
import { Rates } from '@services/rates'
import { CurrencyPipe } from '@angular/common'

@Component({
  selector: 'app-view',
  imports: [
    ...MATERIAL_MODULES,
    MatIconModule,
    CurrencyPipe
  ],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  ratesService = inject(Rates)
  route = inject(ActivatedRoute)
  router = inject(Router)

  code = this.route.snapshot.paramMap.get('code')
  index = Number(this.route.snapshot.paramMap.get('index'))
  rate = signal<BillingRate>({} as BillingRate)

  /** Loads the billing rate data by index from the SharePoint PositionTable */
  async ngOnInit() {
    const data = await this.ratesService.get(this.code ?? '', this.index)
    this.rate.set(data)
  }

  /** Navigates to the billing rate edit form */
  edit() {
    this.router.navigate(['/rates', this.code, this.index, 'edit'])
  }

  /** Navigates back to the billing rate list */
  back() {
    this.router.navigate(['/rates', this.code, 'list'])
  }
}
