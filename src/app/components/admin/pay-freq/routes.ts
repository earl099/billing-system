import { Route } from "@angular/router";
import { PayFreqListComponent } from './pay.freq.list/pay.freq.list.component';
import { authGuard } from "../../../shared/authguards/auth.guard";

export const PAYFREQ_ROUTES: Route[] = [
  { path: 'pay-freq', component: PayFreqListComponent, canActivate: [authGuard] }
]
