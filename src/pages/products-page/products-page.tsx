import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, ChevronDown, ChevronUp,
  AlertTriangle, Trash2, Sliders, Package, SlidersHorizontal, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  getProducts, getAlertProducts, getOutOfStockProducts, getAlertCounts,
  deleteProduct, updateThreshold, updateStock, createProduct, updateInterval,
} from '@/api/products'
import { Modal } from '@/components/modal'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/cn'
import type { Product } from '@/types'
import type { StockBarProps, ProductCardProps } from './products-page.type'

const PAGE_LIMIT = 10

type Tab = 'all' | 'alerts' | 'out-of-stock'

const styles = {
  root: 'min-h-full flex flex-col bg-bg',
  header: 'px-4 pt-12 pb-4 md:pt-8',
  searchBar: 'flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3',
  searchInput: 'flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none',
  list: 'flex-1 px-4 grid grid-cols-1 gap-2 content-start',
  card: 'bg-surface border border-border rounded-2xl overflow-hidden',
  cardHeader: 'flex justify-between gap-3 px-4 py-3.5 items-center w-full text-left',
  expandedBody: 'border-t border-border px-4 py-4',
  actionRow: 'flex items-center gap-2 flex-wrap',
  actionBtn: 'flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors',
  label: 'text-xs font-semibold text-text-sub uppercase tracking-wider block mb-1.5',
  input: 'w-full bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary text-sm outline-none focus:border-border-focus',
  emptyState: 'col-span-full flex flex-col items-center justify-center gap-3 py-16',
} as const

function isStale(p: Product): boolean {
  if (!p.updateIntervalDays || !p.stockLastUpdatedAt) return false
  return Date.now() - new Date(p.stockLastUpdatedAt).getTime() > p.updateIntervalDays * 86_400_000
}

function StockBar({ value, max, threshold }: StockBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const isDanger = value === 0
  const isWarning = !isDanger && threshold > 0 && value <= threshold
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-surface-high overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all',
          isDanger ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success',
        )}
        style={{ width: isDanger ? '100%' : `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Stock: ${value}`}
      />
    </div>
  )
}

function ProductCard({
  product: p, expanded, isManager,
  onToggle, onEditStock, onEditThreshold, onEditInterval, onDelete,
}: ProductCardProps) {
  const zero  = p.currentStock === 0
  const stale = !zero && isStale(p)
  const low   = !zero && !stale && p.lowStockThreshold > 0 && p.currentStock <= p.lowStockThreshold
  const barMax = p.lowStockThreshold > 0
    ? Math.max(p.lowStockThreshold * 2, p.currentStock)
    : Math.max(p.currentStock, 1)

  return (
    <article className={cn(styles.card, zero && 'border-danger/50', stale && 'border-danger/40')}>
      <button type="button" className={styles.cardHeader} onClick={onToggle}
        aria-expanded={expanded} aria-controls={`product-${p.productId}-details`}>
        <div className={cn(
          'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0',
          zero || stale ? 'bg-danger-bg border-danger/30' :
          low  ? 'bg-warning/10 border-warning/20' :
                 'bg-accent-bg border-accent/20',
        )}>
          <Package size={16}
            className={cn(zero || stale ? 'text-danger' : low ? 'text-warning' : 'text-accent')}
            aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-text-primary text-sm font-semibold">{p.name}</p>
            {zero  && <span className="text-[10px] font-bold uppercase tracking-wide bg-danger/15 text-danger px-1.5 py-0.5 rounded-md">Out of stock</span>}
            {!zero && low   && <AlertTriangle size={14} className="text-warning shrink-0" aria-label="Low stock" />}
            {!zero && stale && <Clock size={14} className="text-danger shrink-0" aria-label="Stock update overdue" />}
          </div>
          {p.brand && <p className="text-text-muted text-xs truncate">{p.brand}</p>}
          {p.stockLastUpdatedAt && (
            <p className="text-text-muted text-xs truncate">
              Last updated:{" "}
              {new Date(p.stockLastUpdatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {zero  && <p className="text-danger text-xs mt-0.5 font-medium">No units remaining</p>}
          {stale && <p className="text-danger text-xs mt-0.5 font-medium">Stock should be updated</p>}
          <StockBar value={p.currentStock} max={barMax} threshold={p.lowStockThreshold} />
        </div>
        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span className={cn('text-lg font-bold',
            zero || stale ? 'text-danger' : low ? 'text-warning' : 'text-text-primary')}>
            {p.currentStock}
          </span>
          <span className="text-text-muted text-xs">in stock</span>
          {expanded
            ? <ChevronUp   size={16} className="text-text-muted mt-1" aria-hidden="true" />
            : <ChevronDown size={16} className="text-text-muted mt-1" aria-hidden="true" />}
        </div>
      </button>
      {expanded && (
        <div id={`product-${p.productId}-details`} className={styles.expandedBody}>
          <div className={styles.actionRow}>
            <button type="button" onClick={onEditStock}
              className={cn(styles.actionBtn, 'border-accent/30 bg-accent-bg text-accent hover:bg-accent/20')}>
              <Sliders size={13} aria-hidden="true" /> Update stock
            </button>
            {isManager && (
              <button type="button" onClick={onEditThreshold}
                className={cn(styles.actionBtn, 'border-border text-text-sub hover:border-border-focus hover:text-text-primary')}>
                <SlidersHorizontal size={13} aria-hidden="true" /> Set threshold
              </button>
            )}
            {isManager && (
              <button type="button" onClick={onEditInterval}
                className={cn(styles.actionBtn, 'border-border text-text-sub hover:border-border-focus hover:text-text-primary')}>
                <Clock size={13} aria-hidden="true" /> Set update interval
              </button>
            )}
            {isManager && (
              <button type="button" onClick={onDelete}
                className={cn(styles.actionBtn, 'border-danger/30 text-danger hover:bg-danger-bg ml-auto')}
                aria-label={`Delete ${p.name}`}>
                <Trash2 size={13} aria-hidden="true" /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

// ── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({
  activeTab, onTabChange,
  alertCount, outOfStockCount,
}: {
  activeTab: Tab
  onTabChange: (t: Tab) => void
  alertCount: number | undefined
  outOfStockCount: number | undefined
}) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all',          label: 'All' },
    { id: 'alerts',       label: 'Alerts',       count: alertCount },
    { id: 'out-of-stock', label: 'Out of Stock',  count: outOfStockCount },
  ]

  return (
    <div className="flex gap-1 px-4 pb-3" role="tablist" aria-label="Product filter tabs">
      {tabs.map(({ id, label, count }) => {
        const isActive = activeTab === id
        const hasCount = count != null && count > 0
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(107,138,255,0.35)]'
                : 'bg-surface border border-border text-text-sub hover:text-text-primary hover:border-border-focus',
            )}
          >
            {label}
            {hasCount && (
              <span className={cn(
                'text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
                isActive ? 'bg-white/20 text-white' : 'bg-danger/15 text-danger',
              )}>
                {count! > 99 ? '99+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Product list panel (shared across all 3 tabs) ─────────────────────────

function ProductList({
  tab, search, isManager,
  expanded, onToggle,
  onEditStock, onEditThreshold, onEditInterval, onDelete,
  onRetry,
}: {
  tab: Tab
  search: string
  isManager: boolean
  expanded: string | null
  onToggle: (id: string) => void
  onEditStock: (p: Product) => void
  onEditThreshold: (p: Product) => void
  onEditInterval: (p: Product) => void
  onDelete: (p: Product) => void
  onRetry: () => void
}) {
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(1)

  // Reset to p1 when search or tab changes
  // We rely on the parent resetting page via key prop instead

  const queryFn = tab === 'all'
    ? () => getProducts(page, PAGE_LIMIT, debouncedSearch)
    : tab === 'alerts'
      ? () => getAlertProducts(page, PAGE_LIMIT, debouncedSearch)
      : () => getOutOfStockProducts(page, PAGE_LIMIT, debouncedSearch)

  const { data, isLoading, isError } = useQuery({
    queryKey: [tab, debouncedSearch, page],
    queryFn,
    placeholderData: (prev) => prev,
    // Alerts and out-of-stock tabs are only mounted when selected, so always enabled
  })

  const products: Product[] = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  const emptyLabel =
    tab === 'alerts'       ? (search ? 'No alert products match your search' : 'No alerts — everything looks good!') :
    tab === 'out-of-stock' ? (search ? 'No out-of-stock products match your search' : 'No out-of-stock products!') :
                             (search ? 'No products match your search' : 'No products yet')

  return (
    <>
      <section className={styles.list} aria-label="Product list" role="tabpanel">
        {isLoading && (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
              role="status" aria-label="Loading products" />
          </div>
        )}
        {!isLoading && isError && (
          <div className={styles.emptyState}>
            <p className="text-danger text-sm font-medium">Failed to load products</p>
            <button type="button" onClick={onRetry} className="text-accent text-sm">Retry</button>
          </div>
        )}
        {!isLoading && !isError && products.length === 0 && (
          <div className={styles.emptyState}>
            <Package size={40} className="text-text-muted" aria-hidden="true" />
            <p className="text-text-sub text-sm">{emptyLabel}</p>
          </div>
        )}
        {!isLoading && !isError && products.map(p => (
          <ProductCard
            key={p.productId} product={p}
            expanded={expanded === p.productId} isManager={isManager}
            onToggle={() => onToggle(p.productId)}
            onEditStock={() => onEditStock(p)}
            onEditThreshold={() => onEditThreshold(p)}
            onEditInterval={() => onEditInterval(p)}
            onDelete={() => onDelete(p)}
          />
        ))}
      </section>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-4 pb-28 md:pb-8">
          <button type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-sub disabled:opacity-30 hover:border-border-focus hover:text-text-primary transition-colors">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="text-text-sub text-sm tabular-nums">
            <span className="text-text-primary font-semibold">{page}</span>
            {' / '}
            {totalPages}
          </span>
          <button type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-sub disabled:opacity-30 hover:border-border-focus hover:text-text-primary transition-colors">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const isManager = user?.role === 'manager'

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const [stockModal, setStockModal] = useState<Product | null>(null)
  const [thresholdModal, setThresholdModal] = useState<Product | null>(null)
  const [intervalModal, setIntervalModal] = useState<Product | null>(null)
  const [deleteModal, setDeleteModal] = useState<Product | null>(null)
  const [addModal, setAddModal] = useState(false)

  const [stockInput, setStockInput] = useState('')
  const [thresholdInput, setThresholdInput] = useState('')
  const [intervalInput, setIntervalInput] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', initialStock: '0' })

  // Badge counts — fetched once on mount, refetched after mutations
  const { data: counts } = useQuery({
    queryKey: ['product-counts'],
    queryFn: getAlertCounts,
    staleTime: 60_000,
  })

  const handleTabChange = (t: Tab) => {
    setActiveTab(t)
    setSearch('')
    setExpanded(null)
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['all'] })
    qc.invalidateQueries({ queryKey: ['alerts'] })
    qc.invalidateQueries({ queryKey: ['out-of-stock'] })
    qc.invalidateQueries({ queryKey: ['product-counts'] })
  }

  const stockMut = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateStock(id, qty),
    onSuccess: () => { invalidate(); toast('Stock updated', 'success'); setStockModal(null); setStockInput('') },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message ?? 'Failed to update stock', 'error')
    },
  })

  const thresholdMut = useMutation({
    mutationFn: ({ id, threshold }: { id: string; threshold: number }) => updateThreshold(id, threshold),
    onSuccess: () => { invalidate(); toast('Threshold updated', 'success'); setThresholdModal(null); setThresholdInput('') },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message ?? 'Failed to update threshold', 'error')
    },
  })

  const intervalMut = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number | null }) => updateInterval(id, days),
    onSuccess: () => { invalidate(); toast('Update interval saved', 'success'); setIntervalModal(null); setIntervalInput('') },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message ?? 'Failed to save interval', 'error')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { invalidate(); toast('Product deleted', 'success'); setDeleteModal(null); setExpanded(null) },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message ?? 'Failed to delete product', 'error')
    },
  })

  const addMut = useMutation({
    mutationFn: () => createProduct({
      name: newProduct.name.trim(),
      brand: newProduct.brand.trim() || undefined,
      initialStock: parseInt(newProduct.initialStock, 10) || 0,
    }),
    onSuccess: () => {
      invalidate(); toast('Product added', 'success')
      setAddModal(false); setNewProduct({ name: '', brand: '', initialStock: '0' })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message ?? 'Failed to add product', 'error')
    },
  })

  const openStockModal     = (p: Product) => { setStockInput(String(p.currentStock));  setStockModal(p) }
  const openThresholdModal = (p: Product) => { setThresholdInput(String(p.lowStockThreshold)); setThresholdModal(p) }
  const openIntervalModal  = (p: Product) => { setIntervalInput(p.updateIntervalDays != null ? String(p.updateIntervalDays) : ''); setIntervalModal(p) }

  const handleStockSave = () => {
    if (!stockModal) return
    const qty = parseInt(stockInput, 10)
    if (isNaN(qty) || qty < 0) return
    stockMut.mutate({ id: stockModal.productId, qty })
  }

  const handleThresholdSave = () => {
    if (!thresholdModal) return
    const t = parseInt(thresholdInput, 10)
    if (isNaN(t) || t < 0) return
    thresholdMut.mutate({ id: thresholdModal.productId, threshold: t })
  }

  const handleIntervalSave = () => {
    if (!intervalModal) return
    const days = intervalInput.trim() === '' ? null : parseInt(intervalInput, 10)
    if (days !== null && (isNaN(days) || days < 1)) return
    intervalMut.mutate({ id: intervalModal.productId, days })
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Inventory</h1>
          </div>
          {isManager && (
            <button type="button" onClick={() => setAddModal(true)} aria-label="Add new product"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-light transition-colors shadow-[0_0_16px_rgba(107,138,255,0.3)] text-white text-sm font-semibold">
              <Plus size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={18} className="text-text-muted shrink-0" aria-hidden="true" />
          <input type="search" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" aria-label="Search products"
            className={styles.searchInput} />
        </div>
      </header>

      {/* Tabs */}
      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={counts?.alerts}
        outOfStockCount={counts?.outOfStock}
      />

      {/* Product list — remounted on tab change to reset page state */}
      <ProductList
        key={activeTab}
        tab={activeTab}
        search={search}
        isManager={isManager}
        expanded={expanded}
        onToggle={id => setExpanded(prev => prev === id ? null : id)}
        onEditStock={openStockModal}
        onEditThreshold={openThresholdModal}
        onEditInterval={openIntervalModal}
        onDelete={p => setDeleteModal(p)}
        onRetry={invalidate}
      />

      {/* Stock modal */}
      <Modal open={stockModal !== null} onClose={() => { setStockModal(null); setStockInput('') }}
        title={`Update Stock — ${stockModal?.name ?? ''}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="stock-value" className={styles.label}>New stock count</label>
            <input id="stock-value" type="number" value={stockInput}
              onChange={e => setStockInput(e.target.value)} min={0} placeholder="0"
              className={styles.input} autoFocus />
          </div>
          <button type="button" onClick={handleStockSave} disabled={stockMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {stockMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Threshold modal */}
      <Modal open={thresholdModal !== null} onClose={() => { setThresholdModal(null); setThresholdInput('') }}
        title={`Low-stock Threshold — ${thresholdModal?.name ?? ''}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="threshold-value" className={styles.label}>Alert when stock drops to</label>
            <input id="threshold-value" type="number" value={thresholdInput}
              onChange={e => setThresholdInput(e.target.value)} min={0} placeholder="0"
              className={styles.input} autoFocus />
          </div>
          <button type="button" onClick={handleThresholdSave} disabled={thresholdMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {thresholdMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Interval modal */}
      <Modal open={intervalModal !== null} onClose={() => { setIntervalModal(null); setIntervalInput('') }}
        title={`Update Interval — ${intervalModal?.name ?? ''}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="interval-value" className={styles.label}>Remind to update stock after (days)</label>
            <input id="interval-value" type="number" value={intervalInput}
              onChange={e => setIntervalInput(e.target.value)} min={1}
              placeholder="Leave blank to disable" className={styles.input} autoFocus />
            <p className="text-text-muted text-xs mt-1.5">
              A red clock alert appears if nobody updates the stock within this many days. Leave blank to turn off.
            </p>
          </div>
          <button type="button" onClick={handleIntervalSave} disabled={intervalMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {intervalMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteModal !== null} onClose={() => setDeleteModal(null)} title="Delete Product">
        <div className="flex flex-col gap-4">
          <p className="text-text-sub text-sm">
            Are you sure you want to delete{' '}
            <span className="text-text-primary font-semibold">{deleteModal?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDeleteModal(null)}
              className="flex-1 border border-border text-text-sub py-3 rounded-xl text-sm hover:border-border-focus transition-colors">
              Cancel
            </button>
            <button type="button"
              onClick={() => deleteModal && deleteMut.mutate(deleteModal.productId)}
              disabled={deleteMut.isPending}
              className="flex-1 bg-danger hover:bg-danger/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add product modal */}
      <Modal open={addModal}
        onClose={() => { setAddModal(false); setNewProduct({ name: '', brand: '', initialStock: '0' }) }}
        title="Add Product">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="new-name" className={styles.label}>Product name *</label>
              <input id="new-name" type="text" value={newProduct.name}
                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sourdough Loaf" required className={styles.input} />
            </div>
            <div>
              <label htmlFor="new-brand" className={styles.label}>Brand</label>
              <input id="new-brand" type="text" value={newProduct.brand}
                onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))}
                placeholder="Optional" className={styles.input} />
            </div>
            <div>
              <label htmlFor="new-stock" className={styles.label}>Initial stock</label>
              <input id="new-stock" type="number" value={newProduct.initialStock}
                onChange={e => setNewProduct(p => ({ ...p, initialStock: e.target.value }))}
                min={0} className={styles.input} />
            </div>
          </div>
          <button type="button" onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !newProduct.name.trim()}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {addMut.isPending ? 'Adding…' : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
