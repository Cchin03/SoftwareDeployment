'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/sidebar'
import ProductsTable from '@/components/productsTable'

/* ── Types ── */
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

type Product = {
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

type Order = {
  id: string
  status: string
  total: number
  date: string
  city: string | null
  address: string | null
  items: number
  created_at: string
}

function stockStatus(stock: number): StockStatus {
  if (stock > 10) return 'In Stock'
  if (stock > 0)  return 'Low Stock'
  return 'Out of Stock'
}

const stockBadge: Record<StockStatus, string> = {
  'In Stock':     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Low Stock':    'bg-amber-50 text-amber-700 ring-amber-200',
  'Out of Stock': 'bg-red-50 text-red-600 ring-red-200',
}
const orderBadge: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 ring-amber-200',
  processing: 'bg-blue-50 text-blue-700 ring-blue-200',
  shipped:    'bg-cyan-50 text-cyan-700 ring-cyan-200',
  delivered:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled:  'bg-red-50 text-red-600 ring-red-200',
}

function getOrderBadge(status: string) {
  return orderBadge[status?.toLowerCase()] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
}

const SERVICES = [
  { name: 'Web Server',          online: true,  status: 'Online' },
  { name: 'Database (Supabase)', online: true,  status: 'Online' },
  { name: 'Payment Gateway',     online: true,  status: 'Online' },
  { name: 'Email Service',       online: false, status: 'Slow'   },
  { name: 'CDN / Storage',       online: true,  status: 'Online' },
]

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const supabase = createClient()

  const [products, setProducts]       = useState<Product[]>([])
  const [orders, setOrders]           = useState<Order[]>([])
  const [loading, setLoading]         = useState(true)
  const [categories, setCategories]   = useState<string[]>([])
  const [orderFilter, setOrderFilter] = useState('All Orders')
  const [toast, setToast]             = useState('')
  const [metrics, setMetrics]         = useState({ cpu: 34, ram: 61, disk: 22, net: 48 })
  const [lastChecked, setLastChecked] = useState('Just now')
  const [userName, setUserName]       = useState('Admin')
  const [userEmail, setUserEmail]     = useState('admin@shopkl.com')

  // Stats
  const [totalProductCount, setTotalProductCount] = useState(0)
  const [totalOrderCount, setTotalOrderCount]     = useState(0)
  const [totalRevenue, setTotalRevenue]           = useState(0)
  const [totalUserCount, setTotalUserCount]       = useState(0)

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct]         = useState({ name: '', price: '', brand: '' })
  const [saving, setSaving]                 = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOrder, setEditingOrder]     = useState<Order | null>(null)
  const [editOrderForm, setEditOrderForm]   = useState({ status: '', address: '', note: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? 'admin@shopkl.com')
        setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin')
      }
    }
    getUser()
  }, [supabase])

  /* ── Fetch Products ── */
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        price,
        image,
        rating,
        reviews,
        categories ( name ),
        product_variants ( stock_quantity )
      `)
      .order('name')

    const formatted: Product[] = (data ?? []).map((p: any) => ({
      id:       p.id,
      name:     p.name,
      brand:    p.brand ?? null,
      price:    parseFloat(p.price) || 0,
      image:    p.image ?? null,
      rating:   p.rating ?? null,
      reviews:  p.reviews ?? null,
      category: p.categories?.name ?? 'Uncategorized',
      stock:    (p.product_variants ?? []).reduce((sum: number, v: any) => sum + (v.stock_quantity ?? 0), 0),
    }))

    setProducts(formatted)

    // Derive unique categories for filter chips
    const cats = [...new Set(formatted.map(p => p.category))].filter(Boolean)
    setCategories(cats)

    setTotalProductCount(formatted.length)
  }, [supabase])

  /* ── Fetch Orders ── */
  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, date, city, address, items, created_at')
      .order('created_at', { ascending: false })

    const formatted: Order[] = (data ?? []).map((o: any) => ({
      id:         o.id,
      status:     o.status ?? 'Pending',
      total:      parseFloat(o.total) || 0,
      date:       o.date ?? '',
      city:       o.city ?? null,
      address:    o.address ?? null,
      items:      o.items ?? 0,
      created_at: o.created_at ?? '',
    }))

    setOrders(formatted)
    setTotalOrderCount(formatted.length)

    // Revenue from delivered orders
    const revenue = formatted
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)
    setTotalRevenue(revenue)
  }, [supabase])

  /* ── Fetch User Count ── */
  const fetchUserCount = useCallback(async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    setTotalUserCount(count ?? 0)
  }, [supabase])

  /* ── Init ── */
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchOrders(), fetchUserCount()])
      setLoading(false)
    }
    init()
  }, [fetchProducts, fetchOrders, fetchUserCount])

  /* ── Metrics ticker ── */
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics({
        cpu:  Math.floor(30 + Math.random() * 25),
        ram:  Math.floor(55 + Math.random() * 20),
        disk: Math.floor(15 + Math.random() * 30),
        net:  Math.floor(35 + Math.random() * 40),
      })
      setLastChecked(new Date().toLocaleTimeString())
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  /* ── Add Product (inserts into products only — no variant) ── */
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) { alert('Please fill all required fields.'); return }
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name:  newProduct.name,
      brand: newProduct.brand || null,
      price: parseFloat(newProduct.price),
    })
    setSaving(false)
    if (error) { showToast('❌ Error adding product'); return }
    await fetchProducts()
    setNewProduct({ name: '', price: '', brand: '' })
    setShowAddProduct(false)
    showToast(`"${newProduct.name}" added!`)
  }

  /* ── Save Edit Product ── */
  const saveEditProduct = async () => {
    if (!editingProduct) return
    setSaving(true)
    const { error } = await supabase
      .from('products')
      .update({ name: editingProduct.name, price: editingProduct.price, brand: editingProduct.brand })
      .eq('id', editingProduct.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating product'); return }
    await fetchProducts()
    setEditingProduct(null)
    showToast('Product updated')
  }

  /* ── Delete Product ── */
  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast('❌ Error deleting'); return }
    await fetchProducts()
    showToast('Product removed')
  }

  /* ── Order actions ── */
  const openEditOrder = (o: Order) => {
    setEditingOrder(o)
    setEditOrderForm({ status: o.status, address: o.address ?? '', note: '' })
  }

  const saveOrder = async () => {
    if (!editingOrder) return
    setSaving(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: editOrderForm.status, address: editOrderForm.address })
      .eq('id', editingOrder.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating order'); return }
    await fetchOrders()
    setEditingOrder(null)
    showToast('Order updated')
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm(`Cancel order ${orderId}?`)) return
    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId)
    if (error) { showToast('❌ Error cancelling'); return }
    await fetchOrders()
    showToast(`Order ${orderId} cancelled`)
  }

  /* ── Derived ── */
  const filteredOrders   = orders.filter(o => orderFilter === 'All Orders' || o.status?.toLowerCase() === orderFilter.toLowerCase())

  /* ── Loading screen ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2756)' }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <p className="text-blue-300 text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  )

  /* ── Stat card data (uses live state) ── */
  const STATS = [
    {
      label: 'Total Products', value: totalProductCount.toString(), change: 'Live',
      grad: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', glow: 'rgba(59,130,246,0.35)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>,
    },
    {
      label: 'Total Orders', value: totalOrderCount.toString(), change: 'Live',
      grad: 'linear-gradient(135deg, #7c3aed, #a855f7)', glow: 'rgba(168,85,247,0.35)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    },
    {
      label: 'Revenue (Delivered)', value: `RM ${totalRevenue.toFixed(0)}`, change: 'Live',
      grad: 'linear-gradient(135deg, #059669, #10b981)', glow: 'rgba(16,185,129,0.35)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Registered Users', value: totalUserCount.toString(), change: 'Live',
      grad: 'linear-gradient(135deg, #d97706, #f59e0b)', glow: 'rgba(245,158,11,0.35)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(160deg, #e8eeff 0%, #f0f4ff 50%, #eaf0ff 100%)' }}>

      <Sidebar userName={userName} userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ══ PAGE HEADER ══ */}
        <div className="relative overflow-hidden px-8 py-11" style={{ background: 'linear-gradient(120deg, #0a1628 0%, #0f2756 45%, #1a52c7 100%)' }}>
          <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,160,255,0.15), transparent 70%)' }} />
          <div className="pointer-events-none absolute top-0 right-64 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(165,148,255,0.12), transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-10 left-40 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)' }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </div>
                <h1 className="text-white text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span style={{ color: 'rgba(147,197,253,0.6)' }}>Home</span>
                <span style={{ color: 'rgba(147,197,253,0.3)' }}>/</span>
                <span style={{ color: 'rgba(147,197,253,0.6)' }}>Admin</span>
                <span style={{ color: 'rgba(147,197,253,0.3)' }}>/</span>
                <span className="text-white font-medium">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Live</span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-12">

          {/* ══ STAT CARDS ══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-8">
            {STATS.map((s, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 cursor-default"
                style={{ background: s.grad, boxShadow: `0 8px 32px ${s.glow}, 0 2px 8px rgba(0,0,0,0.12)` }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-inner" style={{ background: 'rgba(255,255,255,0.18)' }}>
                      {s.icon}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.95)' }}>
                      {s.change}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">{s.value}</div>
                  <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ══ MANAGE PRODUCTS ══ */}
          <section id="manage-products" className="mb-10">
            <SectionTitle title="Manage Products" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>} />
            <ProductsTable
              products={products}
              categories={categories}
              onEdit={p => setEditingProduct({ ...p })}
              onDelete={deleteProduct}
              onAddNew={() => setShowAddProduct(true)}
            />
          </section>

          {/* ══ MANAGE ORDERS ══ */}
          <section id="manage-orders" className="mb-10">
            <SectionTitle title="Manage Orders" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>} />

            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  Order List
                </span>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
                    <button key={f} onClick={() => setOrderFilter(f)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                      style={orderFilter === f
                        ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }
                        : { background: '#fff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                      }>
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #eff6ff' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, #eff6ff, #eef2ff)' }}>
                        {['Order ID', 'City', 'Items', 'Total', 'Date', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#1e40af' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, i) => (
                        <tr key={o.id} className="border-b transition-colors"
                          style={{ borderColor: '#f0f4ff', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff')}
                        >
                          <td className="px-4 py-3.5 font-bold text-blue-700 text-xs">{o.id}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 text-sm">{o.city ?? '—'}</div>
                            <div className="text-xs text-slate-400 truncate max-w-40">{o.address ?? ''}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{o.items} item{o.items !== 1 ? 's' : ''}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">RM {o.total.toFixed(2)}</td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs">{o.date}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${getOrderBadge(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5">
                              <Btn variant="edit" onClick={() => openEditOrder(o)} />
                              {o.status?.toLowerCase() !== 'cancelled' && (
                                <Btn variant="cancel" onClick={() => cancelOrder(o.id)} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* ══ SERVER MONITOR ══ */}
          <section id="server-monitor" className="mb-10">
            <SectionTitle title="Server Monitor" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
                  <span className="text-white font-bold text-sm">📈 System Metrics</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { label: 'CPU Usage',    value: metrics.cpu,  sub: '4 cores active',                               color: '#3b82f6', bar: 'linear-gradient(90deg, #1d4ed8, #60a5fa)' },
                    { label: 'Memory (RAM)', value: metrics.ram,  sub: `${(metrics.ram * 0.1).toFixed(1)} GB / 10 GB`,  color: '#06b6d4', bar: 'linear-gradient(90deg, #0e7490, #22d3ee)' },
                    { label: 'Disk I/O',     value: metrics.disk, sub: 'SSD – 220 MB/s',                               color: '#f59e0b', bar: 'linear-gradient(90deg, #b45309, #fbbf24)' },
                    { label: 'Network',      value: metrics.net,  sub: '↑ 24 Mbps ↓ 12 Mbps',                         color: '#8b5cf6', bar: 'linear-gradient(90deg, #6d28d9, #a78bfa)' },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #f0f4ff, #eef2ff)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{m.label}</span>
                        <span className="text-xl font-extrabold" style={{ color: m.color }}>{m.value}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.07)' }}>
                        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${m.value}%`, background: m.bar }} />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service status */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div className="px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
                  <span className="text-white font-bold text-sm">💓 Service Status</span>
                </div>
                <div className="p-5 space-y-3">
                  {SERVICES.map(s => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8faff' }}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-sm text-slate-700 font-medium">{s.name}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 rounded-xl p-3" style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
                    <div className="text-xs text-slate-400 mb-0.5">Last checked</div>
                    <div className="text-sm font-semibold text-slate-700">{lastChecked}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>{/* /px-8 */}
      </div>{/* /main */}

      {/* ══ MODALS ══ */}
      {showAddProduct && (
        <Modal title="Add New Product" onClose={() => setShowAddProduct(false)}>
          <div className="space-y-4">
            <MField label="Product Name">
              <input className={iCls} placeholder="e.g. White Linen Shirt" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </MField>
            <MField label="Brand">
              <input className={iCls} placeholder="e.g. Zara" value={newProduct.brand} onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))} />
            </MField>
            <MField label="Price (RM)">
              <input className={iCls} type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
            </MField>
          </div>
          <MFooter onCancel={() => setShowAddProduct(false)} onSave={addProduct} label="Add Product" saving={saving} />
        </Modal>
      )}

      {editingProduct && (
        <Modal title="Edit Product" onClose={() => setEditingProduct(null)}>
          <div className="space-y-4">
            <MField label="Product Name">
              <input className={iCls} value={editingProduct.name} onChange={e => setEditingProduct(p => p ? { ...p, name: e.target.value } : p)} />
            </MField>
            <MField label="Brand">
              <input className={iCls} value={editingProduct.brand ?? ''} onChange={e => setEditingProduct(p => p ? { ...p, brand: e.target.value } : p)} />
            </MField>
            <MField label="Price (RM)">
              <input className={iCls} type="number" value={editingProduct.price} onChange={e => setEditingProduct(p => p ? { ...p, price: parseFloat(e.target.value) } : p)} />
            </MField>
          </div>
          <MFooter onCancel={() => setEditingProduct(null)} onSave={saveEditProduct} label="Save Changes" saving={saving} />
        </Modal>
      )}

      {editingOrder && (
        <Modal title={`Edit Order ${editingOrder.id}`} onClose={() => setEditingOrder(null)}>
          <div className="space-y-4">
            <MField label="Status">
              <select className={iCls} value={editOrderForm.status} onChange={e => setEditOrderForm(f => ({ ...f, status: e.target.value }))}>
                {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </MField>
            <MField label="Delivery Address">
              <input className={iCls} value={editOrderForm.address} onChange={e => setEditOrderForm(f => ({ ...f, address: e.target.value }))} />
            </MField>
            <MField label="Admin Note">
              <textarea className={`${iCls} h-20 resize-none`} placeholder="Add a note…" value={editOrderForm.note} onChange={e => setEditOrderForm(f => ({ ...f, note: e.target.value }))} />
            </MField>
          </div>
          <MFooter onCancel={() => setEditingOrder(null)} onSave={saveOrder} label="Save Changes" saving={saving} />
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}

/* ══ SUB-COMPONENTS ══ */

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>{icon}</div>
      <h2 className="text-lg font-bold" style={{ color: '#0f2756' }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #bfdbfe, transparent)' }} />
    </div>
  )
}

function Btn({ variant, onClick }: { variant: 'edit' | 'delete' | 'cancel'; onClick: () => void }) {
  const styles = {
    edit:   { bg: '#eff6ff', hoverBg: '#dbeafe', color: '#1d4ed8', label: '✏️' },
    delete: { bg: '#fef2f2', hoverBg: '#fee2e2', color: '#dc2626', label: '🗑️' },
    cancel: { bg: '#fef2f2', hoverBg: '#fee2e2', color: '#dc2626', label: '🚫' },
  }[variant]

  return (
    <button onClick={onClick} className="px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{ background: styles.bg, color: styles.color }}
      onMouseEnter={e => (e.currentTarget.style.background = styles.hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = styles.bg)}
    >{styles.label}</button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
          <h5 className="text-white font-bold text-sm">{title}</h5>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition" style={{ background: 'rgba(255,255,255,0.1)' }}>✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function MFooter({ onCancel, onSave, label, saving }: { onCancel: () => void; onSave: () => void; label: string; saving: boolean }) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f0f4ff' }}>
      <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition"
        style={{ background: '#f0f4ff', border: '1.5px solid #dbeafe' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
        onMouseLeave={e => (e.currentTarget.style.background = '#f0f4ff')}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}

const iCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition'
  + ' border-2 border-slate-200 focus:border-blue-400 bg-white'
