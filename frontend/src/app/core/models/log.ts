/**
 * Audit log data transfer object
 * Represents a user operation recorded for audit trail purposes
 */
export interface LogDTO {
  /** MongoDB document ID (optional for creation) */
  _id?: string
  /** Description of the operation performed (e.g., 'Created Billing Rate') */
  operation: string
  /** Username of the user who performed the operation */
  user?: string
}
