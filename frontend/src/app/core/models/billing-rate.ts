/**
 * Billing rate definition for a position
 * Used in SharePoint Excel PositionTable templates
 */
export interface BillingRate {
  /** Unique position code identifier */
  posCode: string
  /** Position name/title */
  posName: string
  /** Base salary or wage amount */
  salaryWage: number
  /** Salary type classification (e.g., 'Monthly', 'Daily') */
  salaryType: string
  /** Computed daily rate */
  dailyRate: number
  /** Computed monthly rate */
  monthlyRate: number
  /** Computed semi-monthly rate (monthlyRate / 2) */
  semiMonthlyRate: number
}
