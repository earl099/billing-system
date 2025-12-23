import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { Auth } from '@services/auth';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxSonnerToaster,
    RouterLink
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('LBRDC Billing System');
  protected readonly toast = toast
  authService = inject(Auth)
  router = inject(Router)
  user = signal<any>({})

  ngOnInit(): void {
    this.user.set(this.authService.getProfile())
  }

  home() {
    if(this.user()) {
      return '/dashboard'
    }
    else {
      return '/'
    }
  }
}
