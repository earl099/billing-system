/**
 * Pay frequency data transfer object
 * Represents a pay frequency configuration (e.g., 'Semi-monthly', 'Monthly')
 */
export interface PayFreqDTO {
  /** MongoDB document ID (optional for creation) */
  _id?: string
  /** Pay frequency type name */
  payType: string
}
