import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-account.list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './account.list.component.html',
  styleUrl: './account.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListComponent { }
