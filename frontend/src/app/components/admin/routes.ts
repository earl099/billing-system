import { Route } from "@angular/router";
import { AccountListComponent } from "./account/account.list/account.list.component";
import { authGuard } from "@shared/guards/auth.guard";
import { PayFreqListComponent } from "./pay-freq/pay.freq.list/pay.freq.list.component";
import { Settings } from "./settings/settings";

export const ACCOUNT_ROUTES: Route[] = [
  { path: 'accounts', component: AccountListComponent, canActivate: [authGuard] },
  { path: 'payfreq', component: PayFreqListComponent, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
]
