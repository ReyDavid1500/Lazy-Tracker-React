import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles, AlertTriangle, CheckCircle, RefreshCcw,
  Package, Tag, Hash, Plus, Minus
} from 'lucide-react'
import { confirmScan } from '../api/scan'
import { createProduct } from '../api/products'
import { useToast } from '../store/toast'
import type { ScanResponse } from '../types'

const FUZZY_WARNING_THRESHOLD = 0.65

export default function ConfirmPage() {
  const { state } = useLocation() as { state: { scanResult: ScanResponse } | null }
  const navigate = useNavigate()
  const toast = useToast()

  const [qty, setQty] = useState(1)
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

  const handleConfirm = async () => {
    if (!product) return
    setSubmitting(true)
    try {
      await confirmScan(product.id, qty)
      toast(`Stock updated: +${qty} ${product.name}`, 'success')
      navigate('/scan', { replace: true })
    } catch (err: any) {
      toast(err.response?.data?.message ?? 'Failed to update stock', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNew = async () => {
    const { identification } = scanResult
    setSubmitting(true)
    try {
      const { data } = await createProduct({
        name: identification.name,
        brand: identification.brand ?? undefined,
        sku: identification.sku ?? undefined,
        initialStock: qty
      })
      toast(`Added "${data.name}" with stock ${qty}`, 'success')
      navigate('/products', { replace: true })
    } catch (err: any) {
      toast(err.response?.data?.message ?? 'Failed to add product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-bg px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-bg border border-accent/20 flex items-center justify-center">
          <Sparkles size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">AI Scan Result</h1>
          <p className="text-text-sub text-xs">Review before updating stock</p>
        </div>
      </div>

      {isFound ? (
        <>
          {/* Fuzzy match warning */}
          {isFuzzy && (
            <div className="flex gap-3 bg-warning-bg border border-warning/30 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-warning text-sm font-medium">Approximate match</p>
                <p className="text-text-sub text-xs mt-0.5">
                  Confidence {Math.round(product!.matchScore * 100)}% — double-check this is the right product
                </p>
              </div>
            </div>
          )}

          {/* Product card */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-text-primary font-semibold text-base leading-snug">{product!.name}</h2>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                product!.matchType === 'sku'
                  ? 'bg-success/20 text-success'
                  : isFuzzy
                  ? 'bg-warning/20 text-warning'
                  : 'bg-accent-bg text-accent'
              }`}>
                {product!.matchType === 'sku' ? 'SKU match' : isFuzzy ? 'Fuzzy' : 'Exact'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {product!.brand && (
                <span className="flex items-center gap-1.5 text-xs text-text-sub bg-surface-high px-3 py-1.5 rounded-lg">
                  <Tag size={12} />
                  {product!.brand}
                </span>
              )}
              {product!.sku && (
                <span className="flex items-center gap-1.5 text-xs text-text-sub bg-surface-high px-3 py-1.5 rounded-lg">
                  <Hash size={12} />
                  {product!.sku}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-high rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">Current stock</p>
                <p className="text-text-primary font-bold text-xl">{product!.currentStock}</p>
              </div>
              <div className="bg-surface-high rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">After update</p>
                <p className="text-accent font-bold text-xl">{product!.currentStock + qty}</p>
              </div>
            </div>
          </div>

          {/* Quantity control */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-text-sub uppercase tracking-wider block mb-3">
              Quantity to add
            </label>
            <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-2">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center text-text-primary hover:bg-border transition-colors"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-transparent text-center text-4xl font-bold text-text-primary outline-none"
                min={1}
              />
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center text-text-primary hover:bg-border transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(79,106,255,0.3)] transition-colors"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><CheckCircle size={18} />Confirm +{qty} units</>
              )}
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="w-full flex items-center justify-center gap-2 border border-border text-text-sub py-3 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
            >
              Not my product — add as new
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Not found / dismissed — show what Claude identified */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Package size={24} className="text-text-sub" />
              <div>
                <p className="text-text-primary font-semibold">New product detected</p>
                <p className="text-text-sub text-sm">Not found in your inventory</p>
              </div>
            </div>

            {scanResult.identification.name && (
              <div className="bg-surface-high rounded-xl p-3 mt-2">
                <p className="text-text-muted text-xs mb-1">Product name</p>
                <p className="text-text-primary text-sm font-medium">{scanResult.identification.name}</p>
              </div>
            )}
            {scanResult.identification.brand && (
              <div className="bg-surface-high rounded-xl p-3 mt-2">
                <p className="text-text-muted text-xs mb-1">Brand</p>
                <p className="text-text-sub text-sm">{scanResult.identification.brand}</p>
              </div>
            )}
            {scanResult.identification.sku && (
              <div className="bg-surface-high rounded-xl p-3 mt-2">
                <p className="text-text-muted text-xs mb-1">SKU / Barcode</p>
                <p className="text-accent text-sm font-mono">{scanResult.identification.sku}</p>
              </div>
            )}
            {scanResult.identification.description && (
              <div className="bg-surface-high rounded-xl p-3 mt-2">
                <p className="text-text-muted text-xs mb-1">Description</p>
                <p className="text-text-sub text-sm">{scanResult.identification.description}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-text-sub uppercase tracking-wider block mb-3">
              Initial quantity
            </label>
            <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-2">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center text-text-primary hover:bg-border transition-colors"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-transparent text-center text-4xl font-bold text-text-primary outline-none"
                min={1}
              />
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center text-text-primary hover:bg-border transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddNew}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(79,106,255,0.3)] transition-colors"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Package size={18} />Add to Inventory</>
              )}
            </button>

            <button
              onClick={() => navigate('/scan', { replace: true })}
              className="w-full flex items-center justify-center gap-2 border border-border text-text-sub py-3 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
            >
              <RefreshCcw size={18} />
              Scan again
            </button>
          </div>
        </>
      )}
    </div>
  )
}
