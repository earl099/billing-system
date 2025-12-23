import { Route } from "@angular/router";
import { UserList } from "./user-list/user-list";
import { UserCreate } from "./user-create/user-create";
import { UserView } from "./user-view/user-view";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { UserUpdate } from "./user-update/user-update";

export const USER_ROUTES: Route[] = [
  { path: 'user/list', component: UserList, canActivate: [authGuard, roleGuard] },
  { path: 'user/create', component: UserCreate, canActivate: [authGuard, roleGuard] },
  { path: 'user/:id', component: UserView, canActivate: [authGuard, roleGuard] },
  { path: 'user/:id/edit', component: UserUpdate, canActivate: [authGuard, roleGuard] }
]
