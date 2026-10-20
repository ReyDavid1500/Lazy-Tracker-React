import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Sliders,
  Package,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import {
  getProducts,
  deleteProduct,
  updateThreshold,
  updateStock,
  createProduct,
  updateInterval,
} from "@/api/products";
import { Modal } from "@/components/modal";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { cn } from "@/lib/cn";
import type { Product } from "@/types";
import type { StockBarProps, ProductCardProps } from "./products-page.type";

const styles = {
  root: "min-h-full flex flex-col bg-bg",
  header: "px-4 pt-12 pb-4 md:pt-8",
  searchBar:
    "flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3",
  searchInput:
    "flex-1 bg-transparent text-text-primary text-sm placeholder-text-muted outline-none",
  list: "flex-1 px-4 pb-24 md:pb-8 grid grid-cols-1 gap-2 content-start",
  card: "bg-surface border border-border rounded-2xl overflow-hidden",
  cardHeader:
    "flex justify-between gap-3 px-4 py-3.5 items-center w-full text-left",
  expandedBody: "border-t border-border px-4 py-4",
  actionRow: "flex items-center gap-2 flex-wrap",
  actionBtn:
    "flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors",
  label:
    "text-xs font-semibold text-text-sub uppercase tracking-wider block mb-1.5",
  input:
    "w-full bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary text-sm outline-none focus:border-border-focus",
  emptyState:
    "col-span-full flex flex-col items-center justify-center gap-3 py-16",
} as const;

/** Returns true if the product's stock is overdue for an update */
function isStale(p: Product): boolean {
  if (!p.updateIntervalDays || !p.stockLastUpdatedAt) return false;
  const lastUpdate = new Date(p.stockLastUpdatedAt).getTime();
  const intervalMs = p.updateIntervalDays * 24 * 60 * 60 * 1000;
  return Date.now() - lastUpdate > intervalMs;
}

function StockBar({ value, max, threshold }: StockBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isWarning = threshold > 0 && value <= threshold;

  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-surface-high overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          isWarning ? "bg-warning" : "bg-success",
        )}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Stock: ${value}`}
      />
    </div>
  );
}

function ProductCard({
  product: p,
  expanded,
  isManager,
  onToggle,
  onEditStock,
  onEditThreshold,
  onEditInterval,
  onDelete,
}: ProductCardProps) {
  const isLow =
    p.lowStockThreshold > 0 && p.currentStock <= p.lowStockThreshold;
  const stale = isStale(p);
  const barMax =
    p.lowStockThreshold > 0
      ? Math.max(p.lowStockThreshold * 2, p.currentStock)
      : Math.max(p.currentStock, 1);

  return (
    <article className={cn(styles.card, stale && "border-danger/40")}>
      <button
        type="button"
        className={styles.cardHeader}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`product-${p.productId}-details`}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
            stale
              ? "bg-danger-bg border-danger/30"
              : "bg-accent-bg border-accent/20",
          )}
        >
          <Package
            size={16}
            className={stale ? "text-danger" : "text-accent"}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-text-primary text-sm font-semibold">{p.name}</p>
            {isLow && (
              <AlertTriangle
                size={14}
                className="text-warning shrink-0"
                aria-label="Low stock"
              />
            )}
            {stale && (
              <Clock
                size={14}
                className="text-danger shrink-0"
                aria-label="Stock update overdue"
              />
            )}
          </div>
          {p.brand && (
            <p className="text-text-muted text-xs truncate">{p.brand}</p>
          )}
          {p.stockLastUpdatedAt && (
            <p className="text-text-muted text-xs truncate">
              Last updated:{" "}
              {new Date(p.stockLastUpdatedAt).toLocaleDateString()}
            </p>
          )}
          {stale && (
            <p className="text-danger text-xs mt-0.5 font-medium">
              Stock should be updated
            </p>
          )}
          <StockBar
            value={p.currentStock}
            max={barMax}
            threshold={p.lowStockThreshold}
          />
        </div>

        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span
            className={cn(
              "text-lg font-bold",
              stale
                ? "text-danger"
                : isLow
                  ? "text-warning"
                  : "text-text-primary",
            )}
          >
            {p.currentStock}
          </span>
          <span className="text-text-muted text-xs">in stock</span>
          {expanded ? (
            <ChevronUp
              size={16}
              className="text-text-muted mt-1"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              size={16}
              className="text-text-muted mt-1"
              aria-hidden="true"
            />
          )}
        </div>
      </button>

      {expanded && (
        <div
          id={`product-${p.productId}-details`}
          className={styles.expandedBody}
        >
          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={onEditStock}
              className={cn(
                styles.actionBtn,
                "border-accent/30 bg-accent-bg text-accent hover:bg-accent/20",
              )}
            >
              <Sliders size={13} aria-hidden="true" />
              Update stock
            </button>

            {isManager && (
              <button
                type="button"
                onClick={onEditThreshold}
                className={cn(
                  styles.actionBtn,
                  "border-border text-text-sub hover:border-border-focus hover:text-text-primary",
                )}
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                Set threshold
              </button>
            )}

            {isManager && (
              <button
                type="button"
                onClick={onEditInterval}
                className={cn(
                  styles.actionBtn,
                  "border-border text-text-sub hover:border-border-focus hover:text-text-primary",
                )}
              >
                <Clock size={13} aria-hidden="true" />
                Update interval
              </button>
            )}

            {isManager && (
              <button
                type="button"
                onClick={onDelete}
                className={cn(
                  styles.actionBtn,
                  "border-danger/30 text-danger hover:bg-danger-bg ml-auto",
                )}
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function ProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const isManager = user?.role === "manager";

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [thresholdModal, setThresholdModal] = useState<Product | null>(null);
  const [intervalModal, setIntervalModal] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [addModal, setAddModal] = useState(false);

  const [stockInput, setStockInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("");
  const [intervalInput, setIntervalInput] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    initialStock: "0",
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const stockMut = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      updateStock(id, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Stock updated", "success");
      setStockModal(null);
      setStockInput("");
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast(
        axiosErr.response?.data?.message ?? "Failed to update stock",
        "error",
      );
    },
  });

  const thresholdMut = useMutation({
    mutationFn: ({ id, threshold }: { id: string; threshold: number }) =>
      updateThreshold(id, threshold),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Threshold updated", "success");
      setThresholdModal(null);
      setThresholdInput("");
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast(
        axiosErr.response?.data?.message ?? "Failed to update threshold",
        "error",
      );
    },
  });

  const intervalMut = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number | null }) =>
      updateInterval(id, days),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Update interval saved", "success");
      setIntervalModal(null);
      setIntervalInput("");
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast(
        axiosErr.response?.data?.message ?? "Failed to save interval",
        "error",
      );
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Product deleted", "success");
      setDeleteModal(null);
      setExpanded(null);
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast(
        axiosErr.response?.data?.message ?? "Failed to delete product",
        "error",
      );
    },
  });

  const addMut = useMutation({
    mutationFn: () =>
      createProduct({
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim() || undefined,
        initialStock: parseInt(newProduct.initialStock, 10) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast("Product added", "success");
      setAddModal(false);
      setNewProduct({ name: "", brand: "", initialStock: "0" });
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast(
        axiosErr.response?.data?.message ?? "Failed to add product",
        "error",
      );
    },
  });

  const isLowStock = (p: Product): boolean =>
    p.lowStockThreshold > 0 && p.currentStock <= p.lowStockThreshold;

  const filtered = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      // Priority: stale > low stock > normal
      const aStale = isStale(a) ? 0 : 1;
      const bStale = isStale(b) ? 0 : 1;
      if (aStale !== bStale) return aStale - bStale;
      const aLow = isLowStock(a) ? 0 : 1;
      const bLow = isLowStock(b) ? 0 : 1;
      return aLow - bLow;
    });

  const openStockModal = (p: Product): void => {
    setStockInput(String(p.currentStock));
    setStockModal(p);
  };

  const openThresholdModal = (p: Product): void => {
    setThresholdInput(String(p.lowStockThreshold));
    setThresholdModal(p);
  };

  const openIntervalModal = (p: Product): void => {
    setIntervalInput(
      p.updateIntervalDays != null ? String(p.updateIntervalDays) : "",
    );
    setIntervalModal(p);
  };

  const handleStockSave = (): void => {
    if (!stockModal) return;
    const qty = parseInt(stockInput, 10);
    if (isNaN(qty) || qty < 0) return;
    stockMut.mutate({ id: stockModal.productId, qty });
  };

  const handleThresholdSave = (): void => {
    if (!thresholdModal) return;
    const threshold = parseInt(thresholdInput, 10);
    if (isNaN(threshold) || threshold < 0) return;
    thresholdMut.mutate({ id: thresholdModal.productId, threshold });
  };

  const handleIntervalSave = (): void => {
    if (!intervalModal) return;
    const days =
      intervalInput.trim() === "" ? null : parseInt(intervalInput, 10);
    if (days !== null && (isNaN(days) || days < 1)) return;
    intervalMut.mutate({ id: intervalModal.productId, days });
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Inventory</h1>
            <p className="text-text-sub text-sm mt-0.5">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => setAddModal(true)}
              aria-label="Add new product"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-light transition-colors shadow-[0_0_16px_rgba(79,106,255,0.3)] text-white text-sm font-semibold"
            >
              <Plus size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          )}
        </div>

        <div className={styles.searchBar}>
          <Search
            size={18}
            className="text-text-muted shrink-0"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className={styles.searchInput}
          />
        </div>
      </header>

      <section className={styles.list} aria-label="Product list">
        {isLoading && (
          <div className="col-span-full flex items-center justify-center py-12">
            <div
              className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
              role="status"
              aria-label="Loading products"
            />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Package size={40} className="text-text-muted" aria-hidden="true" />
            <p className="text-text-sub text-sm">
              {search ? "No products match your search" : "No products yet"}
            </p>
            {!search && isManager && (
              <button
                type="button"
                onClick={() => setAddModal(true)}
                className="text-accent text-sm font-medium"
              >
                Add your first product
              </button>
            )}
          </div>
        )}

        {!isLoading &&
          filtered.map((p) => (
            <ProductCard
              key={p.productId}
              product={p}
              expanded={expanded === p.productId}
              isManager={isManager}
              onToggle={() =>
                setExpanded((prev) =>
                  prev === p.productId ? null : p.productId,
                )
              }
              onEditStock={() => openStockModal(p)}
              onEditThreshold={() => openThresholdModal(p)}
              onEditInterval={() => openIntervalModal(p)}
              onDelete={() => setDeleteModal(p)}
            />
          ))}
      </section>

      {/* Stock update modal */}
      <Modal
        open={stockModal !== null}
        onClose={() => {
          setStockModal(null);
          setStockInput("");
        }}
        title={`Update Stock — ${stockModal?.name ?? ""}`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="stock-value" className={styles.label}>
              New stock count
            </label>
            <input
              id="stock-value"
              type="number"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              min={0}
              placeholder="0"
              aria-describedby="stock-hint"
              className={styles.input}
              autoFocus
            />
            <p id="stock-hint" className="text-text-muted text-xs mt-1.5">
              Enter the actual number of units currently in stock.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStockSave}
            disabled={stockMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {stockMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Threshold modal */}
      <Modal
        open={thresholdModal !== null}
        onClose={() => {
          setThresholdModal(null);
          setThresholdInput("");
        }}
        title={`Low-stock Threshold — ${thresholdModal?.name ?? ""}`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="threshold-value" className={styles.label}>
              Alert when stock drops to
            </label>
            <input
              id="threshold-value"
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              min={0}
              placeholder="0"
              className={styles.input}
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={handleThresholdSave}
            disabled={thresholdMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {thresholdMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Update interval modal */}
      <Modal
        open={intervalModal !== null}
        onClose={() => {
          setIntervalModal(null);
          setIntervalInput("");
        }}
        title={`Update Interval — ${intervalModal?.name ?? ""}`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="interval-value" className={styles.label}>
              Remind to update stock after (days)
            </label>
            <input
              id="interval-value"
              type="number"
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              min={1}
              placeholder="Leave blank to disable"
              aria-describedby="interval-hint"
              className={styles.input}
              autoFocus
            />
            <p id="interval-hint" className="text-text-muted text-xs mt-1.5">
              A red clock alert appears on this product if nobody updates the
              stock within this many days. Leave blank to turn off the alert.
            </p>
          </div>
          <button
            type="button"
            onClick={handleIntervalSave}
            disabled={intervalMut.isPending}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {intervalMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="Delete Product"
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-sub text-sm">
            Are you sure you want to delete{" "}
            <span className="text-text-primary font-semibold">
              {deleteModal?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteModal(null)}
              className="flex-1 border border-border text-text-sub py-3 rounded-xl text-sm hover:border-border-focus transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                deleteModal && deleteMut.mutate(deleteModal.productId)
              }
              disabled={deleteMut.isPending}
              className="flex-1 bg-danger hover:bg-danger/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add product modal */}
      <Modal
        open={addModal}
        onClose={() => {
          setAddModal(false);
          setNewProduct({ name: "", brand: "", initialStock: "0" });
        }}
        title="Add Product"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="new-name" className={styles.label}>
                Product name *
              </label>
              <input
                id="new-name"
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Sourdough Loaf"
                required
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="new-brand" className={styles.label}>
                Brand
              </label>
              <input
                id="new-brand"
                type="text"
                value={newProduct.brand}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, brand: e.target.value }))
                }
                placeholder="Optional"
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="new-stock" className={styles.label}>
                Initial stock
              </label>
              <input
                id="new-stock"
                type="number"
                value={newProduct.initialStock}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, initialStock: e.target.value }))
                }
                min={0}
                className={styles.input}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !newProduct.name.trim()}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {addMut.isPending ? "Adding…" : "Add Product"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
