import type { Product } from '@/types'

export type StockBarProps = {
  readonly value: number
  readonly max: number
  readonly threshold: number
}

export type ProductCardProps = {
  readonly product: Product
  readonly expanded: boolean
  readonly isManager: boolean
  readonly onToggle: () => void
  readonly onEditStock: () => void
  readonly onEditThreshold: () => void
  readonly onEditInterval: () => void
  readonly onDelete: () => void
}
