import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles, AlertTriangle, CheckCircle, RefreshCcw,
  Package, Tag,
} from 'lucide-react'
import { confirmScan } from '@/api/scan'
import { createProduct } from '@/api/products'
import { useToast } from '@/store/toast'
import type { ScanResponse } from '@/types'

const FUZZY_WARNING_THRESHOLD = 0.65

const styles = {
  root: 'min-h-full flex flex-col bg-bg px-4 pt-12 pb-8 md:pt-8',
  inner: 'w-full max-w-xl mx-auto',
  header: 'flex items-center gap-3 mb-6',
  headerIcon: 'w-10 h-10 rounded-xl bg-accent-bg border border-accent/20 flex items-center justify-center',
  card: 'bg-surface border border-border rounded-2xl p-5 mb-6',
  statGrid: 'grid grid-cols-2 gap-3',
  statCell: 'bg-surface-high rounded-xl p-3',
  label: 'text-xs font-semibold text-text-sub uppercase tracking-wider block mb-3',
  qtyRow: 'flex bg-surface border border-border rounded-2xl p-2',
  qtyBtn: 'w-24 h-16 rounded-xl bg-surface-high text-text-primary hover:bg-border transition-colors text-4xl font-bold',
  qtyInput: 'bg-transparent text-center text-4xl font-bold text-text-primary outline-none w-full',
} as const

type LocationState = { scanResult: ScanResponse } | null

export function ConfirmPage() {
  const { state } = useLocation() as { state: LocationState }
  const navigate = useNavigate()
  const toast = useToast()

  const [newStock, setNewStock] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!state?.scanResult) {
    navigate('/scan', { replace: true })
    return null
  }

  const { scanResult } = state
  const product = scanResult.matchedProduct
  const isFound = product !== null && !dismissed
  const isFuzzy = isFound && product!.matchType === 'fuzzy' && product!.matchScore < FUZZY_WARNING_THRESHOLD

  const handleStockChange = (raw: string): void => {
    const parsed = parseInt(raw, 10)
    setNewStock(isNaN(parsed) || parsed < 0 ? 0 : parsed)
  }

  const handleConfirm = async (): Promise<void> => {
    if (!product) return
    setSubmitting(true)
    try {
      await confirmScan(product.id, newStock)
      toast(`Stock set to ${newStock} for ${product.name}`, 'success')
      navigate('/scan', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast(axiosErr.response?.data?.message ?? 'Failed to update stock', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNew = async (): Promise<void> => {
    const { identification } = scanResult
    setSubmitting(true)
    try {
      const { data } = await createProduct({
        name: identification.name,
        brand: identification.brand ?? undefined,
        initialStock: newStock,
      })
      toast(`Added "${data.name}" with stock ${newStock}`, 'success')
      navigate('/products', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast(axiosErr.response?.data?.message ?? 'Failed to add product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <Sparkles size={20} className="text-accent" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AI Scan Result</h1>
            <p className="text-text-sub text-xs">Review before updating stock</p>
          </div>
        </header>

        {isFound ? (
          <>
            {isFuzzy && (
              <div className="flex gap-3 bg-warning-bg border border-warning/30 rounded-xl px-4 py-3 mb-4" role="alert">
                <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-warning text-sm font-medium">Approximate match</p>
                  <p className="text-text-sub text-xs mt-0.5">
                    Confidence {Math.round(product!.matchScore * 100)}% — double-check this is the right product
                  </p>
                </div>
              </div>
            )}

            <article className={styles.card}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-text-primary font-semibold text-base leading-snug">{product!.name}</h2>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                  isFuzzy
                    ? 'bg-warning/20 text-warning'
                    : 'bg-accent-bg text-accent'
                }`}>
                  {isFuzzy ? 'Fuzzy' : 'Exact'}
                </span>
              </div>

              {product!.brand && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1.5 text-xs text-text-sub bg-surface-high px-3 py-1.5 rounded-lg">
                    <Tag size={12} aria-hidden="true" />
                    {product!.brand}
                  </span>
                </div>
              )}

              <div className={styles.statGrid}>
                <div className={styles.statCell}>
                  <p className="text-text-muted text-xs mb-1">Current stock</p>
                  <p className="text-text-primary font-bold text-xl">{product!.currentStock}</p>
                </div>
                <div className={styles.statCell}>
                  <p className="text-text-muted text-xs mb-1">New stock</p>
                  <p className="text-accent font-bold text-xl">{newStock}</p>
                </div>
              </div>
            </article>

            <section className="mb-6">
              <label htmlFor="stock-input" className={styles.label}>
                New stock count
              </label>
              <div className={styles.qtyRow}>
                <button
                  type="button"
                  onClick={() => setNewStock(q => Math.max(0, q - 1))}
                  aria-label="Decrease stock"
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <input
                  id="stock-input"
                  type="number"
                  value={newStock}
                  onChange={e => handleStockChange(e.target.value)}
                  className={styles.qtyInput}
                  min={0}
                  aria-label="Stock count"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setNewStock(q => q + 1)}
                  aria-label="Increase stock"
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>
              <p className="text-text-muted text-xs mt-2">Enter the actual number of units in stock.</p>
            </section>

            <div className="flex flex-col gap-3 md:flex-row-reverse">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="md:flex-1 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(79,106,255,0.3)] transition-colors"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Saving" />
                ) : (
                  <><CheckCircle size={18} aria-hidden="true" />Set stock to {newStock}</>
                )}
              </button>

              <button
                onClick={() => setDismissed(true)}
                className="md:flex-1 w-full flex items-center justify-center gap-2 border border-border text-text-sub py-3 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
              >
                Not my product — add as new
              </button>
            </div>
          </>
        ) : (
          <>
            <article className={styles.card}>
              <div className="flex items-center gap-3 mb-3">
                <Package size={24} className="text-text-sub" aria-hidden="true" />
                <div>
                  <p className="text-text-primary font-semibold">New product detected</p>
                  <p className="text-text-sub text-sm">Not found in your inventory</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {scanResult.identification.name && (
                  <div className="bg-surface-high rounded-xl p-3">
                    <p className="text-text-muted text-xs mb-1">Product name</p>
                    <p className="text-text-primary text-sm font-medium">{scanResult.identification.name}</p>
                  </div>
                )}

                {scanResult.identification.brand && (
                  <div className="bg-surface-high rounded-xl p-3">
                    <p className="text-text-muted text-xs mb-1">Brand</p>
                    <p className="text-text-sub text-sm">{scanResult.identification.brand}</p>
                  </div>
                )}

                {scanResult.identification.description && (
                  <div className="bg-surface-high rounded-xl p-3 md:col-span-2">
                    <p className="text-text-muted text-xs mb-1">Description</p>
                    <p className="text-text-sub text-sm">{scanResult.identification.description}</p>
                  </div>
                )}
              </div>
            </article>

            <section className="mb-6">
              <label htmlFor="initial-stock-input" className={styles.label}>
                Initial quantity
              </label>
              <div className={styles.qtyRow}>
                <button
                  type="button"
                  onClick={() => setNewStock(q => Math.max(0, q - 1))}
                  aria-label="Decrease quantity"
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <input
                  id="initial-stock-input"
                  type="number"
                  value={newStock}
                  onChange={e => handleStockChange(e.target.value)}
                  className={styles.qtyInput}
                  min={0}
                  aria-label="Initial stock count"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setNewStock(q => q + 1)}
                  aria-label="Increase quantity"
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>
            </section>

            <div className="flex flex-col gap-3 md:flex-row-reverse">
              <button
                onClick={handleAddNew}
                disabled={submitting}
                className="md:flex-1 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(79,106,255,0.3)] transition-colors"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Saving" />
                ) : (
                  <><Package size={18} aria-hidden="true" />Add to Inventory</>
                )}
              </button>

              <button
                onClick={() => navigate('/scan', { replace: true })}
                className="md:flex-1 w-full flex items-center justify-center gap-2 border border-border text-text-sub py-3 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
              >
                <RefreshCcw size={18} aria-hidden="true" />
                Scan again
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
