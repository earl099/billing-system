import { Route } from "@angular/router";
import { List } from "./list/list";
import { Create } from "./create/create";
import { View } from "./view/view";
import { Update } from "./update/update";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";


export const USER_ROUTES: Route[] = [
  { path: 'user/list', component: List, canActivate: [authGuard, roleGuard] },
  { path: 'user/create', component: Create, canActivate: [authGuard, roleGuard] },
  { path: 'user/:id', component: View, canActivate: [authGuard, roleGuard] },
  { path: 'user/:id/edit', component: Update, canActivate: [authGuard, roleGuard] }
]
