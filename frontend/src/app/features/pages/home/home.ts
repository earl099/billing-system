/**
 * @fileoverview Home (landing page) component
 * Public-facing landing page displayed for unauthenticated users
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';

@Component({
  selector: 'app-home',
  imports: [
    ...MATERIAL_MODULES,
    RouterLink

  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home { }
