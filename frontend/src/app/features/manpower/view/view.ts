/**
 * @fileoverview Manpower employee detail view component
 * Displays all employee fields from the SharePoint EmployeeTable in a read-only view
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Manpower } from '@services/manpower';

@Component({
  selector: 'app-view',
  imports: [...MATERIAL_MODULES],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  route = inject(ActivatedRoute)
  router = inject(Router)
  manpowerService = inject(Manpower)

  employee = signal<any[]>([])
  code: any
  index: any
  fileName: any

  /** Display labels for employee fields, mapped 1:1 to Excel column order */
  fields = [
    'Employee No.',
    'Name',
    'Position Code',
    'Position Name',
    'Department',
    'Status',
    'Type',
    'Pay type',
    'Pay Frequency',
    'TIN',
    'SSS No.',
    'PHIC No.',
    'HDMF No.',
    'HD',
    'MFOPT Amount',
    'Salary',
    'Bank Account No.',
    'Endorsed',
    'Difference',
    'Daily Billing Rate',
    'Monthly Billing Rate'
  ]

  /** Loads the employee data by index from the SharePoint EmployeeTable */
  async ngOnInit() {
    this.index = this.route.snapshot.paramMap.get('index')
    this.code = this.route.snapshot.paramMap.get('code')
    this.fileName = this.route.snapshot.queryParamMap.get('fileName')

    if (!this.fileName) {
      console.error('No template fileName provided')
      return
    }

    try {
      const data = await this.manpowerService.getManpower(
        this.code ?? '',
        Number(this.index),
        this.fileName,
        'EmployeeTable'
      )
      this.employee.set(data.data)
    } catch (error) {
      console.error('Error fetching employee data:', error)
    }
  }

  /** Navigates to the employee edit form */
  edit() {
    this.router.navigate(['manpower', this.code, this.index, 'edit'], {
      queryParams: { fileName: this.fileName }
    })
  }
}
