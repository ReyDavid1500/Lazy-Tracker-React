export type InitialAvatarProps = {
  readonly name: string
  readonly role: string
}

export type AddMemberForm = {
  name: string
  password: string
  role: 'manager' | 'worker'
}
