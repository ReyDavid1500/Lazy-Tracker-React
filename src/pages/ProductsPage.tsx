import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, X, AlertTriangle, Edit3, Trash2, Boxes,
  ChevronDown, ChevronUp, Package
} from 'lucide-react'
import {
  getProducts, updateStock, updateThreshold, deleteProduct
} from '../api/products'
import { Modal } from '../components/Modal'
import { useToast } from '../store/toast'
import { useAuth } from '../store/auth'
import type { Product } from '../types'

function StockBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  const color = value <= 0 ? 'bg-danger' : value < max * 0.5 ? 'bg-warning' : 'bg-success'
  return (
    <div className="h-1.5 bg-surface-high rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ProductsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const isManager = user?.role === 'manager'

  const [search, setSearch] = useState('')
  const [stockModal, setStockModal] = useState<Product | null>(null)
  const [thresholdModal, setThresholdModal] = useState<Product | null>(null)
  const [deleteModal, setDeleteModal] = useState<Product | null>(null)
  const [stockQty, setStockQty] = useState(0)
  const [newThreshold, setNewThreshold] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const stockMut = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateStock(id, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast('Stock updated', 'success')
      setStockModal(null)
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  })

  const thresholdMut = useMutation({
    mutationFn: ({ id, t }: { id: string; t: number }) => updateThreshold(id, t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast('Threshold updated', 'success')
      setThresholdModal(null)
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast('Product removed', 'success')
      setDeleteModal(null)
    },
    onError: (e: any) => toast(e.response?.data?.message ?? 'Failed', 'error'),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q)
    )
  }, [products, search])

  const lowCount = products.filter(p => p.currentStock <= p.lowStockThreshold).length
  const okCount = products.length - lowCount

  const openStock = (p: Product) => { setStockModal(p); setStockQty(1) }
  const openThreshold = (p: Product) => { setThresholdModal(p); setNewThreshold(p.lowStockThreshold) }

  return (
    <div className="min-h-full bg-bg flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Inventory</h1>
            <p className="text-text-sub text-sm mt-0.5">{products.length} products</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-bg border border-accent/20 flex items-center justify-center">
            <Boxes size={20} className="text-accent" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Total', value: products.length, color: 'text-text-primary' },
            { label: 'Low', value: lowCount, color: 'text-warning' },
            { label: 'OK', value: okCount, color: 'text-success' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-text-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand or SKU…"
            className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 px-4 pb-24 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={40} className="text-text-muted" />
            <p className="text-text-sub text-sm">
              {search ? 'No products match your search' : 'No products yet — start scanning!'}
            </p>
          </div>
        ) : (
          filtered.map(p => {
            const isLow = p.currentStock <= p.lowStockThreshold
            const isOpen = expanded === p.id
            const barMax = p.lowStockThreshold > 0
              ? Math.max(p.lowStockThreshold * 2, p.currentStock)
              : Math.max(p.currentStock, 1)
            return (
              <div key={p.id} className={`bg-surface border rounded-2xl overflow-hidden transition-colors ${isLow ? 'border-warning/40' : 'border-border'}`}>
                <button
                  className="w-full text-left px-4 py-4 flex items-center gap-3"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-text-primary font-medium text-sm truncate">{p.name}</p>
                      {isLow && <AlertTriangle size={14} className="text-warning shrink-0" />}
                    </div>
                    {p.brand && <p className="text-text-muted text-xs">{p.brand}</p>}
                    <div className="mt-2">
                      <StockBar value={p.currentStock} max={barMax} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-bold tabular-nums ${isLow ? 'text-warning' : 'text-text-primary'}`}>
                      {p.currentStock}
                    </p>
                    <p className="text-text-muted text-xs">in stock</p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="text-text-muted shrink-0" />
                    : <ChevronDown size={16} className="text-text-muted shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-sub mb-2">
                      {p.sku && <span>SKU: <span className="text-text-primary font-mono">{p.sku}</span></span>}
                      <span>Threshold: <span className="text-text-primary">{p.lowStockThreshold}</span></span>
                    </div>

                    <button
                      onClick={() => openStock(p)}
                      className="w-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium py-2.5 rounded-xl hover:bg-accent/20 transition-colors"
                    >
                      Update Stock
                    </button>

                    {isManager && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openThreshold(p)}
                          className="flex items-center justify-center gap-1.5 border border-border text-text-sub text-sm py-2 rounded-xl hover:border-border-focus hover:text-text-primary transition-colors"
                        >
                          <Edit3 size={14} />
                          Threshold
                        </button>
                        <button
                          onClick={() => setDeleteModal(p)}
                          className="flex items-center justify-center gap-1.5 border border-danger/30 text-danger text-sm py-2 rounded-xl hover:bg-danger-bg transition-colors"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Stock modal */}
      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Update Stock">
        {stockModal && (
          <div className="flex flex-col gap-4">
            <p className="text-text-sub text-sm">
              <span className="text-text-primary font-medium">{stockModal.name}</span>
              {' '}— current stock: <span className="text-text-primary font-bold">{stockModal.currentStock}</span>
            </p>
            <div>
              <label className="text-xs font-semibold text-text-sub uppercase tracking-wider block mb-2">
                Quantity to add (use negative to subtract)
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={e => setStockQty(parseInt(e.target.value) || 0)}
                className="w-full bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary text-center text-2xl font-bold outline-none focus:border-border-focus"
              />
            </div>
            <p className="text-text-sub text-sm text-center">
              New stock: <span className="text-accent font-bold text-lg">{stockModal.currentStock + stockQty}</span>
            </p>
            <button
              onClick={() => stockMut.mutate({ id: stockModal.id, qty: stockQty })}
              disabled={stockMut.isPending || stockQty === 0}
              className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {stockMut.isPending ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        )}
      </Modal>

      {/* Threshold modal */}
      <Modal open={!!thresholdModal} onClose={() => setThresholdModal(null)} title="Low Stock Threshold">
        {thresholdModal && (
          <div className="flex flex-col gap-4">
            <p className="text-text-sub text-sm">
              Alert when <span className="text-text-primary font-medium">{thresholdModal.name}</span> drops below this number
            </p>
            <input
              type="number"
              value={newThreshold}
              onChange={e => setNewThreshold(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              className="w-full bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary text-center text-2xl font-bold outline-none focus:border-border-focus"
            />
            <button
              onClick={() => thresholdMut.mutate({ id: thresholdModal.id, t: newThreshold })}
              disabled={thresholdMut.isPending}
              className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {thresholdMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Remove Product">
        {deleteModal && (
          <div className="flex flex-col gap-4">
            <p className="text-text-sub text-sm">
              Remove <span className="text-text-primary font-medium">"{deleteModal.name}"</span> from inventory? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="border border-border text-text-sub font-medium py-3 rounded-xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleteModal.id)}
                disabled={deleteMut.isPending}
                className="bg-danger/10 border border-danger/30 text-danger font-semibold py-3 rounded-xl text-sm hover:bg-danger-bg disabled:opacity-50 transition-colors"
              >
                {deleteMut.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
