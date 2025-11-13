export interface BillingRate {
  id: string;
  position: string;
  department: string;
  ratePerHour: number;
  effectiveDate: string; // YYYY-MM-DD
}
