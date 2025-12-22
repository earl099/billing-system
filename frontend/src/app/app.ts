import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
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
export class App {
  protected readonly title = signal('LBRDC Billing System');
  protected readonly toast = toast
}
