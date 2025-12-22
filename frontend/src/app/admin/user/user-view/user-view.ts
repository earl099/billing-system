import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-view',
  imports: [],
  templateUrl: './user-view.html',
  styleUrl: './user-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserView { }
