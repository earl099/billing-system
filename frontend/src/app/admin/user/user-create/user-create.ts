import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-create',
  imports: [],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreate { }
