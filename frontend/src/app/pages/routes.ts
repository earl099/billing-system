import { Route } from "@angular/router";
import { Home } from "./home/home";
import { Dashboard } from "./dashboard/dashboard";
import { Login } from "./login/login";
import { Signup } from "./signup/signup";

export const INDEX_ROUTES: Route[] = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'dashboard', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup }
]
