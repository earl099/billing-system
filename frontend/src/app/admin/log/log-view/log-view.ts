import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-log-view',
  imports: [],
  templateUrl: './log-view.html',
  styleUrl: './log-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogView { }
