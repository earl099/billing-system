export interface UserDTO {
  _id?: string
  name?: string
  username?: string
  email?: string
  password?: string
  role?: 'Admin' | 'User'
  handledClients?: string[] | null
}

export interface UserAuthDTO {
  identifier: string
  password: string
}
