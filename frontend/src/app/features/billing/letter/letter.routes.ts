import { Route } from "@angular/router";
import { WordEditor } from "./editor/word-editor";
import { authGuard } from "@guards/auth-guard";

export const BILLING_LETTER_ROUTES: Route[] = [
  { path: 'editor/:code', component: WordEditor, canActivate: [authGuard] }
]
