export type User = {
  id: string
  name: string
  email: string
  userName: string
  role: 'manager' | 'worker'
  businessId: string
}

export type Product = {
  productId: string
  name: string
  brand: string | null
  currentStock: number
  lowStockThreshold: number
  imageUrl?: string | null
  isActive: boolean
  updateIntervalDays: number | null
  stockLastUpdatedAt: string | null  // ISO date string from API
}

export type MatchedProduct = {
  id: string
  name: string
  brand: string | null
  currentStock: number
  lowStockThreshold: number
  stockLastUpdatedAt: string | null
  matchType: 'exact' | 'fuzzy'
  matchScore: number
}

/** What Claude extracted from the image (identification) */
export type ScanIdentification = {
  name: string
  brand: string | null
  description: string | null
  rawNote: string
}

/**
 * Real shape from POST /scan:
 * { identification: ScanIdentification, matchedProduct: MatchedProduct | null }
 */
export type ScanResponse = {
  identification: ScanIdentification
  matchedProduct: MatchedProduct | null
}

/** Team member as returned by GET /users */
export type TeamMember = {
  id: string
  name: string
  userName: string
  role: 'manager' | 'worker'
  businessId: string
}

export type Business = {
  id: string
  name: string
}
