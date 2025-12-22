import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-log-list',
  imports: [],
  templateUrl: './log-list.html',
  styleUrl: './log-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogList { }
