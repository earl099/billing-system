/**
 * User data transfer object
 * Represents a user account with role-based access control
 */
export interface UserDTO {
  /** MongoDB document ID (optional for creation) */
  _id?: string
  /** User's full name */
  name?: string
  /** Login username */
  username?: string
  /** User email address */
  email?: string
  /** Password (only used during creation/update, never returned from API) */
  password?: string
  /** User role determining access level */
  role?: 'Admin' | 'User'
  /** Array of client IDs this user has access to */
  handledClients?: string[] | null
}

/**
 * Authentication request payload
 * Used for login with either username or email as the identifier
 */
export interface UserAuthDTO {
  /** Username or email address for authentication */
  identifier: string
  /** User's password */
  password: string
}
