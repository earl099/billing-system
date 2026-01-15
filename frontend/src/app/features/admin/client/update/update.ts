import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-update',
  imports: [],
  templateUrl: './update.html',
  styleUrl: './update.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Update { }
