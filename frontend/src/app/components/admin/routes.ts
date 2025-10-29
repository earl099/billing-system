import { Route } from "@angular/router";
import { AccountListComponent } from "./account/account.list/account.list.component";
import { authGuard } from "../../shared/guards/auth.guard";
import { PayFreqListComponent } from "./pay-freq/pay.freq.list/pay.freq.list.component";

export const ACCOUNT_ROUTES: Route[] = [
  { path: 'accounts', component: AccountListComponent, canActivate: [authGuard] },
  { path: 'pay-freq', component: PayFreqListComponent, canActivate: [authGuard] }
]
