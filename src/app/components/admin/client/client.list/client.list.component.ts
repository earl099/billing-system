import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-client.list',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './client.list.component.html',
  styleUrl: './client.list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {

  ngOnInit(): void { }

}
