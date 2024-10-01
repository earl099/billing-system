import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-account.page',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './account.page.component.html',
  styleUrl: './account.page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPageComponent { }
