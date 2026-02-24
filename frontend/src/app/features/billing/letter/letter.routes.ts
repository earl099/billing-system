import { Route } from "@angular/router";
import { Editor } from "./editor/editor";
import { authGuard } from "@guards/auth-guard";

export const BILLING_LETTER_ROUTES: Route[] = [
  { path: 'editor/:code', component: Editor, canActivate: [authGuard] }
]
