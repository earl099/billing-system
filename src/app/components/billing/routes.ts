import { Route } from "@angular/router";
import { authGuard } from "../../shared/authguards/auth.guard";
import { AddBillingComponent } from "./add-billing/add-billing.component";

export const BILLING_ROUTES : Route[] = [
  { path: 'add-billing', component: AddBillingComponent, canActivate: [authGuard] },

]
