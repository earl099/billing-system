import { Route } from "@angular/router";
import { List } from "./list/list";
import { Generate } from "./generate/generate";
import { authGuard } from "@guards/auth-guard";
import { View } from "./view/view";

export const SOA_ROUTES: Route[] = [
    { path: 'list', component: List, canActivate: [authGuard] },
    { path: 'generate', component: Generate, canActivate: [authGuard] },
    { path: 'view/:_id', component: View, canActivate: [authGuard] }
]