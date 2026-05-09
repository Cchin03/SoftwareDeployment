'use client'
import { useState, useEffect } from 'react'

/* ── Types ── */
export type Product = {
  id: string
  name: string
  brand: string | null
  price: number
  image: string | null
  rating: number | null
  reviews: number | null
  category: string
  stock: number
}

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

function stockStatus(stock: number): StockStatus {
  if (stock > 10) return 'In Stock'
  if (stock > 0)  return 'Low Stock'
  return 'Out of Stock'
}

const stockBadge: Record<StockStatus, string> = {
  'In Stock': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Out of Stock': 'bg-red-50 text-red-600 ring-red-200',
}

const PAGE_SIZE = 5

type Props = {
  products: Product[]
  categories: string[]
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
  onAddNew: () => void
}

export default function ProductsTable({ products, categories, onEdit, onDelete, onAddNew }: Props) {
  const [catFilter, setCatFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1) }, [catFilter])

  const filtered = products.filter(p => catFilter === 'all' || p.category === catFilter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Build page number array with ellipsis
  const pageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
        <span className="text-white font-bold text-sm flex items-center gap-2">
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          Product List
          <span className="ml-1 text-xs font-normal opacity-70">
            ({filtered.length} total)
          </span>
        </span>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition shadow"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          Add New Product
        </button>
      </div>

      <div className="p-6">

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', ...categories]).map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
              style={catFilter === c
                ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }
                : { background: '#fff', color: '#1d4ed8', borderColor: '#bfdbfe' }
              }
            >
              {c === 'all' ? 'All Products' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #eff6ff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #eff6ff, #eef2ff)' }}>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#1e40af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b transition-colors"
                  style={{ borderColor: '#f0f4ff', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff')}
                >
                  {/* Product */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0"
                          style={{ background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)' }}>📦</div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.brand ?? 'No brand'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: '#eff6ff', color: '#1d4ed8' }}>{p.category}</span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3.5 font-bold text-slate-800">RM {p.price.toFixed(2)}</td>

                  {/* Stock */}
                  <td className="px-4 py-3.5 text-slate-600 text-sm">{p.stock} units</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${stockBadge[stockStatus(p.stock)]}`}>
                      {stockStatus(p.stock)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <ActionBtn variant="edit"   onClick={() => onEdit(p)} />
                      <ActionBtn variant="delete" onClick={() => onDelete(p.id, p.name)} />
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid #f0f4ff' }}>

            {/* Info */}
            <span className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-600">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
              </span>
              {' '}of{' '}
              <span className="font-semibold text-slate-600">{filtered.length}</span>
              {' '}products
            </span>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 1} label="←" />

              {pageNumbers().map((n, i) =>
                n === '...'
                  ? <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-sm select-none">…</span>
                  : <PagBtn key={n} onClick={() => setPage(n as number)} active={page === n} label={String(n)} />
              )}

              {/* Next */}
              <PagBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages} label="→" />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Small helpers ── */
function ActionBtn({ variant, onClick }: { variant: 'edit' | 'delete'; onClick: () => void }) {
  const styles = {
    edit:   { bg: '#eff6ff', hoverBg: '#dbeafe', color: '#1d4ed8', label: '✏️' },
    delete: { bg: '#fef2f2', hoverBg: '#fee2e2', color: '#dc2626', label: '🗑️' },
  }[variant]

  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{ background: styles.bg, color: styles.color }}
      onMouseEnter={e => (e.currentTarget.style.background = styles.hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = styles.bg)}
    >
      {styles.label}
    </button>
  )
}

function PagBtn({ onClick, disabled, active, label }: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={active
        ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.4)' }
        : { background: '#f0f4ff', color: '#1d4ed8' }
      }
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = '#dbeafe' }}
      onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.background = '#f0f4ff' }}
    >
      {label}
    </button>
  )
}
