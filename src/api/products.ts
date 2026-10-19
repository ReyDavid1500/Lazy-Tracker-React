import { api } from './client'
import type { Product } from '../types'

export const getProducts = () =>
  api.get<Product[]>('/products').then(r => r.data)

export const deleteProduct = (id: string) =>
  api.delete(`/products/${id}`)

export const updateThreshold = (id: string, lowStockThreshold: number) =>
  api.patch(`/products/${id}/threshold`, { lowStockThreshold })

export const updateStock = (productId: string, quantity: number) =>
  api.post(`/stock/${productId}`, { quantity })

export const createProduct = (data: {
  name: string; brand?: string; initialStock: number;
}) => api.post<Product>('/products', data)
