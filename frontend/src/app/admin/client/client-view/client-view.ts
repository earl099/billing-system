import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-view',
  imports: [],
  templateUrl: './client-view.html',
  styleUrl: './client-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientView { }
