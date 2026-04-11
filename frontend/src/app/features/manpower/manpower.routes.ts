import { Route } from "@angular/router";
import { List } from "./list/list";
import { Update } from "./update/update";
import { Create } from "./create/create";
import { View } from "./view/view";
import { authGuard } from "@guards/auth-guard";

export const MANPOWER_ROUTES: Route[] = [
  { path: ':code/list', component: List, canActivate: [authGuard] },
  { path: ':code/:index/edit', component: Update, canActivate: [authGuard] },
  { path: ':code/add', component: Create, canActivate: [authGuard] },
  { path: ':code/:index/view', component: View, canActivate: [authGuard] },
]
