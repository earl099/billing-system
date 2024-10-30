import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { PayFreqListComponent } from './pay.freq.list/pay.freq.list.component';

export const PAYFREQ_ROUTES: Route[] = [
  { path: 'pay-freq', component: PayFreqListComponent, canActivate: [authGuard] }
]
