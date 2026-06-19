/**
 * @fileoverview Admin audit log detail view component
 * Displays a single audit log entry with operation, user, and timestamp
 */

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
  route = inject(ActivatedRoute)
  router = inject(Router)
  logService = inject(Log)
  log = signal<any>({})
  /** Parsed Date object from the log's createdAt timestamp */
  logDate!: Date

  /** Loads the audit log entry by ID and parses the creation date */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!
    this.log.set(await this.logService.get(id))
    this.logDate = new Date(this.log().createdAt)
  }
}
