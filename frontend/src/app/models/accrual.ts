export interface Accrual {
  employeeId: string;
  type: string; // e.g., 'Leave', 'Bonus'
  amount: number;
  period: string; // YYYY-MM
  // Add other relevant accrual fields
}
