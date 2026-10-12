import { api } from './client'
import type { TeamMember } from '../types'

export const getTeam = () =>
  api.get<TeamMember[]>('/users').then(r => r.data)

/** Manager creates a worker. Backend generates the userName automatically. */
export const addMember = (data: { name: string; password: string; role: 'worker' | 'manager' }) =>
  api.post<TeamMember>('/users', data)

// Note: DELETE /users/:id is not implemented in the backend.
// Workers can only be deactivated by the manager — not yet exposed via API.
