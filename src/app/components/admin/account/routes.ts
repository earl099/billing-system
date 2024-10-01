import { Route } from "@angular/router";
import { AccountListComponent } from "./account.list/account.list.component";
import { AccountPageComponent } from "./account.page/account.page.component";
import { authGuard } from "../../../shared/authguards/auth.guard";

export const ACCOUNT_ROUTES: Route[] = [
  { path: 'account', component: AccountListComponent, canActivate: [authGuard] },
  { path: 'account/:id', component: AccountPageComponent, canActivate: [authGuard] }
]
