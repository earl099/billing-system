import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from './partials/sidenav/sidenav.component';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidenavComponent,
    NgxSonnerToaster
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title: any
  protected readonly toast = toast
}
