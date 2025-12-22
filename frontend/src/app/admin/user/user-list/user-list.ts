import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-list',
  imports: [],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList { }
