import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Log } from '@services/log';

@Component({
  selector: 'app-log-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './log-view.html',
  styleUrl: './log-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogView implements OnInit {
  route = inject(ActivatedRoute)
  router = inject(Router)
  logService = inject(Log)
  log = signal<any>({})
  logDate!: Date
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    this.log.set(await this.logService.get(id))
    this.logDate = new Date(this.log().createdAt)
  }
}
