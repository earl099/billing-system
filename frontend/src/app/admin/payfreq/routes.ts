import { Route } from "@angular/router";
import { PayfreqList } from "./payfreq-list/payfreq-list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { PayfreqCreate } from "./payfreq-create/payfreq-create";

export const PAYFREQ_ROUTES: Route[] = [
  { path: 'payfreq/list', component: PayfreqList, canActivate: [authGuard, roleGuard] },
  { path: 'payfreq/create', component: PayfreqCreate, canActivate: [authGuard, roleGuard] }
]
