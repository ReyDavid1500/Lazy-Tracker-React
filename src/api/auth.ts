import { api } from './client'

export type AuthResponse = {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    userName: string
    role: 'manager' | 'worker'
    businessId: string
  }
}

export const login = (identifier: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { identifier, password })

export const register = (data: {
  name: string
  email: string
  password: string
  businessName: string
}) => api.post<AuthResponse>('/auth/register', data)
