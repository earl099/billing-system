/**
 * Client data transfer object
 * Represents a client organization in the system
 */
export interface ClientDTO {
  /** MongoDB document ID (optional for creation) */
  _id?: string
  /** Unique client code (e.g., 'OFBANK', 'ALL') */
  code: string
  /** Client display name */
  name: string
  /** Associated pay frequency ID reference */
  payFreq: string
  /** ISO timestamp of creation (auto-managed) */
  createdAt?: string
  /** ISO timestamp of last update (auto-managed) */
  updatedAt?: string
}
