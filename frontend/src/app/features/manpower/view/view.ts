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

  async ngOnInit() {
    this.index = this.route.snapshot.paramMap.get('index')
    this.code = this.route.snapshot.paramMap.get('code')
    const data = await this.manpowerService.getManpower(this.code ?? '', Number(this.index), 'BILLING-TEMPLATE.xlsm', 'EmployeeTable')
    this.employee.set(data.employee)
    console.log(this.employee())
  }

  edit() {
    this.router.navigate(['manpower', this.code, this.index, 'edit'])
  }
}
