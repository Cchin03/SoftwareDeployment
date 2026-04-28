'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/sidebar'

/* ── Types ── */
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
type Category = 'all' | 'shirts' | 'shoes' | 'pants'

interface Product {
  id: string; name: string; sku: string
  category: 'shirts' | 'shoes' | 'pants'
  price: number; stock: number; emoji: string
}
interface Order {
  id: string; customer: string; city: string
  items: number; total: number; date: string
  status: OrderStatus; address: string
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
const orderBadge: Record<OrderStatus, string> = {
  Pending:    'bg-amber-50 text-amber-700 ring-amber-200',
  Processing: 'bg-blue-50 text-blue-700 ring-blue-200',
  Shipped:    'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Delivered:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled:  'bg-red-50 text-red-600 ring-red-200',
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
  const [catFilter, setCatFilter]     = useState<Category>('all')
  const [orderFilter, setOrderFilter] = useState('All Orders')
  const [toast, setToast]             = useState('')
  const [metrics, setMetrics]         = useState({ cpu: 34, ram: 61, disk: 22, net: 48 })
  const [lastChecked, setLastChecked] = useState('Just now')
  const [userName, setUserName]       = useState('Admin')
  const [userEmail, setUserEmail]     = useState('admin@shopkl.com')

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct]         = useState({ name: '', category: 'shirts', price: '', stock: '', emoji: '👕' })
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

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (!error) setProducts(data as Product[])
  }, [supabase])

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error) setOrders(data as Order[])
  }, [supabase])

  useEffect(() => {
    const init = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchOrders()]); setLoading(false) }
    init()
  }, [fetchProducts, fetchOrders])

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics({ cpu: Math.floor(30 + Math.random() * 25), ram: Math.floor(55 + Math.random() * 20), disk: Math.floor(15 + Math.random() * 30), net: Math.floor(35 + Math.random() * 40) })
      setLastChecked(new Date().toLocaleTimeString())
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) { alert('Please fill all fields.'); return }
    setSaving(true)
    const { error } = await supabase.from('products').insert({ name: newProduct.name, sku: 'SKU-' + Date.now().toString().slice(-6), category: newProduct.category, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock), emoji: newProduct.emoji })
    setSaving(false)
    if (error) { showToast('❌ Error adding product'); return }
    await fetchProducts(); setNewProduct({ name: '', category: 'shirts', price: '', stock: '', emoji: '👕' }); setShowAddProduct(false); showToast(`"${newProduct.name}" added!`)
  }

  const saveEditProduct = async () => {
    if (!editingProduct) return; setSaving(true)
    const { error } = await supabase.from('products').update({ name: editingProduct.name, price: editingProduct.price, stock: editingProduct.stock }).eq('id', editingProduct.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating product'); return }
    await fetchProducts(); setEditingProduct(null); showToast('Product updated')
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast('❌ Error deleting'); return }
    await fetchProducts(); showToast('Product removed')
  }

  const openEditOrder = (o: Order) => { setEditingOrder(o); setEditOrderForm({ status: o.status, address: o.address, note: '' }) }

  const saveOrder = async () => {
    if (!editingOrder) return; setSaving(true)
    const { error } = await supabase.from('orders').update({ status: editOrderForm.status, address: editOrderForm.address }).eq('id', editingOrder.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating order'); return }
    await fetchOrders(); setEditingOrder(null); showToast('Order updated')
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm(`Cancel order ${orderId}?`)) return
    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId)
    if (error) { showToast('❌ Error cancelling'); return }
    await fetchOrders(); showToast(`Order ${orderId} cancelled`)
  }

  const filteredProducts = products.filter(p => catFilter === 'all' || p.category === catFilter)
  const filteredOrders   = orders.filter(o => orderFilter === 'All Orders' || o.status === orderFilter)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2756)' }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <p className="text-blue-300 text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  )

  /* ── Stat card data ── */
  const STATS = [
    {
      label: 'Total Products', value: products.length, change: '+12%', up: true,
      grad: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
      glow: 'rgba(59,130,246,0.35)',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>,
    },
    {
      label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length, change: '+5%', up: true,
      grad: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)',
      glow: 'rgba(6,182,212,0.3)',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    },
    {
      label: 'Total Revenue', value: `RM ${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}`, change: '+18%', up: true,
      grad: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
      glow: 'rgba(139,92,246,0.35)',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Server Uptime', value: '99.8%', change: 'Stable', up: true,
      grad: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      glow: 'rgba(16,185,129,0.3)',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(160deg, #e8eeff 0%, #f0f4ff 50%, #eaf0ff 100%)' }}>

      <Sidebar userName={userName} userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ══ PAGE HEADER ══ */}
        <div className="relative overflow-hidden px-8 py-11" style={{ background: 'linear-gradient(120deg, #0a1628 0%, #0f2756 45%, #1a52c7 100%)' }}>
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,160,255,0.15), transparent 70%)' }} />
          <div className="pointer-events-none absolute top-0 right-64 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(165,148,255,0.12), transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-10 left-40 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)' }} />
          {/* Subtle grid */}
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
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 cursor-default"
                style={{ background: s.grad, boxShadow: `0 8px 32px ${s.glow}, 0 2px 8px rgba(0,0,0,0.12)` }}
              >
                {/* Inner shine */}
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                {/* Big circle decoration */}
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

            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>
              {/* Bar */}
              <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  Product List
                </span>
                <button onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition shadow"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                  Add New Product
                </button>
              </div>

              <div className="p-6">
                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {(['all', 'shirts', 'shoes', 'pants'] as Category[]).map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                      style={catFilter === c
                        ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }
                        : { background: '#fff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                      }>
                      {c === 'all' ? 'All Products' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>

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
                      {filteredProducts.map((p, i) => (
                        <tr key={p.id} className="border-b transition-colors" style={{ borderColor: '#f0f4ff', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff')}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)' }}>{p.emoji}</div>
                              <div>
                                <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                                <div className="text-xs text-slate-400">SKU: {p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{p.category}</span></td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">RM {p.price.toFixed(2)}</td>
                          <td className="px-4 py-3.5 text-slate-600 text-sm">{p.stock} units</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${stockBadge[stockStatus(p.stock)]}`}>
                              {stockStatus(p.stock)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5">
                              <Btn variant="edit"   onClick={() => setEditingProduct({ ...p })} />
                              <Btn variant="delete" onClick={() => deleteProduct(p.id, p.name)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
                        {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#1e40af' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, i) => (
                        <tr key={o.id} className="border-b transition-colors" style={{ borderColor: '#f0f4ff', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff')}
                        >
                          <td className="px-4 py-3.5 font-bold text-blue-700 text-xs">{o.id}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 text-sm">{o.customer}</div>
                            <div className="text-xs text-slate-400">{o.city}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{o.items} item{o.items > 1 ? 's' : ''}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">RM {o.total.toFixed(2)}</td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs">{o.date}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${orderBadge[o.status]}`}>{o.status}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5">
                              <Btn variant="edit" onClick={() => openEditOrder(o)} />
                              {o.status !== 'Cancelled' && <Btn variant="cancel" onClick={() => cancelOrder(o.id)} />}
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
              {/* Metrics */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-lg" style={{ background: '#fff', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0f2756, #1e4db7)' }}>
                  <span className="text-white font-bold text-sm">📈 System Metrics</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { label: 'CPU Usage',    value: metrics.cpu,  sub: '4 cores active',                              color: '#3b82f6', bar: 'linear-gradient(90deg, #1d4ed8, #60a5fa)' },
                    { label: 'Memory (RAM)', value: metrics.ram,  sub: `${(metrics.ram * 0.1).toFixed(1)} GB / 10 GB`, color: '#06b6d4', bar: 'linear-gradient(90deg, #0e7490, #22d3ee)' },
                    { label: 'Disk I/O',     value: metrics.disk, sub: 'SSD – 220 MB/s',                              color: '#f59e0b', bar: 'linear-gradient(90deg, #b45309, #fbbf24)' },
                    { label: 'Network',      value: metrics.net,  sub: '↑ 24 Mbps ↓ 12 Mbps',                        color: '#8b5cf6', bar: 'linear-gradient(90deg, #6d28d9, #a78bfa)' },
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
            <MField label="Product Name"><input className={iCls} placeholder="e.g. White Linen Shirt" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></MField>
            <div className="grid grid-cols-2 gap-4">
              <MField label="Category">
                <select className={iCls} value={newProduct.category} onChange={e => { const em: Record<string, string> = { shirts: '👕', shoes: '👟', pants: '👖' }; setNewProduct(p => ({ ...p, category: e.target.value, emoji: em[e.target.value] || '📦' })) }}>
                  <option value="shirts">Shirts</option><option value="shoes">Shoes</option><option value="pants">Pants</option>
                </select>
              </MField>
              <MField label="Price (RM)"><input className={iCls} type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></MField>
            </div>
            <MField label="Stock Quantity"><input className={iCls} type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} /></MField>
          </div>
          <MFooter onCancel={() => setShowAddProduct(false)} onSave={addProduct} label="Add Product" saving={saving} />
        </Modal>
      )}

      {editingProduct && (
        <Modal title="Edit Product" onClose={() => setEditingProduct(null)}>
          <div className="space-y-4">
            <MField label="Product Name"><input className={iCls} value={editingProduct.name} onChange={e => setEditingProduct(p => p ? { ...p, name: e.target.value } : p)} /></MField>
            <div className="grid grid-cols-2 gap-4">
              <MField label="Price (RM)"><input className={iCls} type="number" value={editingProduct.price} onChange={e => setEditingProduct(p => p ? { ...p, price: parseFloat(e.target.value) } : p)} /></MField>
              <MField label="Stock Quantity"><input className={iCls} type="number" value={editingProduct.stock} onChange={e => setEditingProduct(p => p ? { ...p, stock: parseInt(e.target.value) } : p)} /></MField>
            </div>
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
            <MField label="Delivery Address"><input className={iCls} value={editOrderForm.address} onChange={e => setEditOrderForm(f => ({ ...f, address: e.target.value }))} /></MField>
            <MField label="Admin Note"><textarea className={`${iCls} h-20 resize-none`} placeholder="Add a note…" value={editOrderForm.note} onChange={e => setEditOrderForm(f => ({ ...f, note: e.target.value }))} /></MField>
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

      {/* Back to top */}
      <a href="#" className="fixed bottom-8 left-20 w-11 h-11 flex items-center justify-center rounded-full text-white text-lg shadow-xl z-40 transition hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>↑</a>
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
      <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition" style={{ background: '#f0f4ff', border: '1.5px solid #dbeafe' }}
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
