import { Route } from "@angular/router";
import { AcidGenerate } from "./acid/generate/generate";
import { authGuard } from "@guards/auth-guard";

export const BILLING_ROUTES: Route[] = [
  { path: 'acid/generate', component: AcidGenerate, canActivate: [authGuard] }
]
