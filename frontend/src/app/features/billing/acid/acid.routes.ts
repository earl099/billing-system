import { Route } from "@angular/router";
import { authGuard } from "@guards/auth-guard";
import { Generate } from "./generate/generate";
import { List } from "./list/list";
import { View } from "./view/view";

export const ACID_ROUTES: Route[] = [
  { path: 'generate', component: Generate, canActivate: [authGuard] },
  { path: 'list', component: List, canActivate: [authGuard] },
  { path: 'view/:_id', component: View, canActivate: [authGuard] }
]
