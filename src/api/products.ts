import { api } from './client'
import type { Product } from '../types'

export type PaginatedProducts = {
  data: Product[]
  total: number
  page: number
  limit: number
}

export const getProducts = (page: number, limit: number, search: string) =>
  api
    .get<PaginatedProducts>('/products', { params: { page, limit, search: search || undefined } })
    .then(r => r.data)

export const deleteProduct = (id: string) =>
  api.delete(`/products/${id}`)

export const updateThreshold = (id: string, lowStockThreshold: number) =>
  api.patch(`/products/${id}/threshold`, { lowStockThreshold })

export const updateStock = (productId: string, quantity: number) =>
  api.post(`/stock/${productId}`, { quantity })

export const createProduct = (data: {
  name: string; brand?: string; initialStock: number;
}) => api.post<Product>('/products', data)

export const updateInterval = (id: string, updateIntervalDays: number | null) =>
  api.patch(`/products/${id}/interval`, { updateIntervalDays })

export type AlertCounts = { alerts: number; outOfStock: number }

export const getAlertProducts = (page: number, limit: number, search: string) =>
  api
    .get<PaginatedProducts>('/products/alerts', { params: { page, limit, search: search || undefined } })
    .then(r => r.data)

export const getOutOfStockProducts = (page: number, limit: number, search: string) =>
  api
    .get<PaginatedProducts>('/products/out-of-stock', { params: { page, limit, search: search || undefined } })
    .then(r => r.data)

export const getAlertCounts = () =>
  api.get<AlertCounts>('/products/counts').then(r => r.data)
