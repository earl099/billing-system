import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Log } from '@services/log';

@Component({
  selector: 'app-log-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly logService = inject(Log)
  readonly log = signal<any | null>(null)
  readonly loading = signal(true)
  readonly loadError = signal<string | null>(null)

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) {
      this.loadError.set('The requested audit log could not be found.')
      this.loading.set(false)
      return
    }

    try {
      this.log.set(await this.logService.get(id))
    } catch {
      this.loadError.set('We could not load this audit log. Please return to the audit log list and try again.')
    } finally {
      this.loading.set(false)
    }
  }

  formatDate(value: unknown): string {
    if (!value) return 'Not recorded'
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString()
  }
}
