import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-list',
  imports: [],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientList { }
