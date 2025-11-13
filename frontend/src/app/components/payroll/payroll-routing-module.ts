import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimekeepUpload } from './timekeep-upload/timekeep-upload';
import { PayrollCalculation } from './payroll-calculation/payroll-calculation';
import { RetropayValidation } from './retropay-validation/retropay-validation';
import { Reconciliation } from './reconciliation/reconciliation';
import { GoogleSheetOutput } from './google-sheet-output/google-sheet-output';

const routes: Routes = [
  { path: 'timekeep-upload', component: TimekeepUpload },
  { path: 'calculate', component: PayrollCalculation },
  { path: 'retropay-validation', component: RetropayValidation },
  { path: 'reconciliation', component: Reconciliation },
  { path: 'google-sheet-output', component: GoogleSheetOutput }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PayrollRoutingModule { }
