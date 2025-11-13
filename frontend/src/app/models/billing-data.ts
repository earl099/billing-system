export interface BillingData {
  clientId: string;
  employeeId: string;
  serviceDate: string; // YYYY-MM-DD
  hoursBilled: number;
  rateBilled: number;
  totalAmount: number;
  // Add other relevant billing fields
}
