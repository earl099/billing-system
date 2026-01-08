import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-view',
  imports: [],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View { }
