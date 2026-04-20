// src/app/mnt/user-data/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

/* ── Types ── */
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
type Category = 'all' | 'shirts' | 'shoes' | 'pants'

interface Product {
  id: string
  name: string
  sku: string
  category: 'shirts' | 'shoes' | 'pants'
  price: number
  stock: number
  emoji: string
}

interface Order {
  id: string
  customer: string
  city: string
  items: number
  total: number
  date: string
  status: OrderStatus
  address: string
}

/* ── Helpers ── */
function stockStatus(stock: number): StockStatus {
  if (stock > 10) return 'In Stock'
  if (stock > 0) return 'Low Stock'
  return 'Out of Stock'
}

const stockBadge: Record<StockStatus, string> = {
  'In Stock':     'bg-green-100 text-green-700',
  'Low Stock':    'bg-yellow-100 text-yellow-700',
  'Out of Stock': 'bg-red-100 text-red-600',
}

const orderBadge: Record<OrderStatus, string> = {
  Pending:    'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped:    'bg-cyan-100 text-cyan-700',
  Delivered:  'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-600',
}

const SERVICES = [
  { name: 'Web Server',       online: true,  status: 'Online' },
  { name: 'Database (Supabase)', online: true, status: 'Online' },
  { name: 'Payment Gateway',  online: true,  status: 'Online' },
  { name: 'Email Service',    online: false, status: 'Slow'   },
  { name: 'CDN / Storage',    online: true,  status: 'Online' },
]

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const supabase = createClient()

  /* ── State ── */
  const [products, setProducts]   = useState<Product[]>([])
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [catFilter, setCatFilter] = useState<Category>('all')
  const [orderFilter, setOrderFilter] = useState('All Orders')
  const [toast, setToast]         = useState('')
  const [metrics, setMetrics]     = useState({ cpu: 34, ram: 61, disk: 22, net: 48 })
  const [lastChecked, setLastChecked] = useState('Just now')

  /* Add Product modal */
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'shirts', price: '', stock: '', emoji: '👕' })
  const [saving, setSaving] = useState(false)

  /* Edit Product modal */
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  /* Edit Order modal */
  const [editingOrder, setEditingOrder]     = useState<Order | null>(null)
  const [editOrderForm, setEditOrderForm]   = useState({ status: '', address: '', note: '' })

  /* ── Toast helper ── */
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  /* ── Fetch data from Supabase ── */
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setProducts(data as Product[])
  }, [supabase])

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    setOrders(data as Order[])
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchOrders()])
      setLoading(false)
    }
    init()
  }, [fetchProducts, fetchOrders])

  /* ── Live server metrics ── */
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

  /* ════ PRODUCT ACTIONS ════ */

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert('Please fill all fields.'); return
    }
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name:     newProduct.name,
      sku:      'SKU-' + Date.now().toString().slice(-6),
      category: newProduct.category,
      price:    parseFloat(newProduct.price),
      stock:    parseInt(newProduct.stock),
      emoji:    newProduct.emoji,
    })
    setSaving(false)
    if (error) { showToast('❌ Error adding product'); return }
    await fetchProducts()
    setNewProduct({ name: '', category: 'shirts', price: '', stock: '', emoji: '👕' })
    setShowAddProduct(false)
    showToast(`Product "${newProduct.name}" added!`)
  }

  const saveEditProduct = async () => {
    if (!editingProduct) return
    setSaving(true)
    const { error } = await supabase
      .from('products')
      .update({
        name:  editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
      })
      .eq('id', editingProduct.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating product'); return }
    await fetchProducts()
    setEditingProduct(null)
    showToast('Product updated successfully')
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the store?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast('❌ Error deleting product'); return }
    await fetchProducts()
    showToast('Product removed successfully')
  }

  /* ════ ORDER ACTIONS ════ */

  const openEditOrder = (order: Order) => {
    setEditingOrder(order)
    setEditOrderForm({ status: order.status, address: order.address, note: '' })
  }

  const saveOrder = async () => {
    if (!editingOrder) return
    setSaving(true)
    const { error } = await supabase
      .from('orders')
      .update({
        status:  editOrderForm.status,
        address: editOrderForm.address,
      })
      .eq('id', editingOrder.id)
    setSaving(false)
    if (error) { showToast('❌ Error updating order'); return }
    await fetchOrders()
    setEditingOrder(null)
    showToast('Order updated successfully')
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm(`Cancel order ${orderId}? This cannot be undone.`)) return
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', orderId)
    if (error) { showToast('❌ Error cancelling order'); return }
    await fetchOrders()
    showToast(`Order ${orderId} cancelled`)
  }

  /* ── Filtered lists ── */
  const filteredProducts = products.filter(p => catFilter === 'all' || p.category === catFilter)
  const filteredOrders   = orders.filter(o => orderFilter === 'All Orders' || o.status === orderFilter)

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="bg-linear-to-r from-blue-900 to-blue-600 py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-white/5" />
        <div className="container mx-auto relative z-10">
          <h1 className="text-white text-3xl font-bold mb-2">📊 Admin Dashboard</h1>
          <nav className="text-sm text-white/60">
            <span>Home</span><span className="mx-2">/</span>
            <span>Admin</span><span className="mx-2">/</span>
            <span className="text-white">Dashboard</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          {[
            { icon: '📦', value: products.length,                                    label: 'Total Products',     border: 'border-l-blue-600',   iconBg: 'bg-blue-100 text-blue-700'   },
            { icon: '🛒', value: orders.filter(o => o.status === 'Pending').length,  label: 'Pending Orders',     border: 'border-l-green-500',  iconBg: 'bg-green-100 text-green-700' },
            { icon: '💰', value: `RM ${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}`, label: 'Total Revenue', border: 'border-l-yellow-400', iconBg: 'bg-yellow-100 text-yellow-700' },
            { icon: '🖥️', value: '99.8%',                                             label: 'Server Uptime',      border: 'border-l-cyan-500',   iconBg: 'bg-cyan-100 text-cyan-700'   },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl p-6 shadow-md border-l-4 ${s.border} hover:-translate-y-1 transition-transform`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.iconBg} mb-4`}>{s.icon}</div>
              <div className="text-3xl font-bold text-slate-800">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── MANAGE PRODUCTS ── */}
        <section id="manage-products" className="mb-12">
          <SectionTitle icon="📦" title="Manage Products" />
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
              <h5 className="text-white font-bold">Product List</h5>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 bg-white text-blue-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                ＋ Add New Product
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {(['all', 'shirts', 'shoes', 'pants'] as Category[]).map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition ${
                      catFilter === c
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-700 hover:text-white hover:border-blue-700'
                    }`}>
                    {c === 'all' ? 'All Products' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900 text-xs uppercase font-bold">
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Price</th>
                      <th className="px-4 py-3 text-left">Stock</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-blue-50 hover:bg-blue-50/40 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl">{p.emoji}</div>
                            <div>
                              <div className="font-semibold text-slate-800">{p.name}</div>
                              <div className="text-xs text-slate-400">SKU: {p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize">{p.category}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">RM {p.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">{p.stock} units</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockBadge[stockStatus(p.stock)]}`}>
                            {stockStatus(p.stock)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <ActionBtn color="cyan" onClick={() => setEditingProduct({ ...p })} label="✏️" title="Edit" />
                            <ActionBtn color="red"  onClick={() => deleteProduct(p.id, p.name)} label="🗑️" title="Delete" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── MANAGE ORDERS ── */}
        <section id="manage-orders" className="mb-12">
          <SectionTitle icon="🛒" title="Manage Order Details" />
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
              <h5 className="text-white font-bold">Order List</h5>
              <span className="text-white/70 text-sm">🔽 Filter Orders</span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition ${
                      orderFilter === f
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-700 hover:text-white hover:border-blue-700'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900 text-xs uppercase font-bold">
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="border-b border-blue-50 hover:bg-blue-50/40 transition">
                        <td className="px-4 py-3 font-bold text-slate-800">{o.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{o.customer}</div>
                          <div className="text-xs text-slate-400">{o.city}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{o.items} item{o.items > 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">RM {o.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-500">{o.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${orderBadge[o.status]}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <ActionBtn color="cyan" onClick={() => openEditOrder(o)} label="✏️" title="Edit order" />
                            {o.status !== 'Cancelled' && (
                              <ActionBtn color="red" onClick={() => cancelOrder(o.id)} label="🚫" title="Cancel order" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVER MONITOR ── */}
        <section id="server-monitor" className="mb-12">
          <SectionTitle icon="🖥️" title="Monitor Server Condition" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
                <h5 className="text-white font-bold">📈 System Metrics</h5>
                <span className="text-white/70 text-xs">🔴 Live</span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'CPU Usage',    value: metrics.cpu,  sub: '4 cores active',    bar: 'bg-blue-500'   },
                  { label: 'Memory (RAM)', value: metrics.ram,  sub: `${(metrics.ram * 0.1).toFixed(1)} GB / 10 GB`, bar: 'bg-green-500' },
                  { label: 'Disk I/O',     value: metrics.disk, sub: 'SSD – 220 MB/s',    bar: 'bg-yellow-400' },
                  { label: 'Network',      value: metrics.net,  sub: '↑ 24 Mbps ↓ 12 Mbps', bar: 'bg-cyan-500' },
                ].map(m => (
                  <div key={m.label} className="bg-blue-50 rounded-xl p-5">
                    <div className="text-xs text-slate-500 font-semibold mb-2">{m.label}</div>
                    <div className="text-3xl font-bold text-blue-900">{m.value}%</div>
                    <div className="w-full bg-blue-100 rounded-full h-2 mt-3">
                      <div className={`${m.bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${m.value}%` }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-blue-700 px-6 py-4">
                <h5 className="text-white font-bold">💓 Service Status</h5>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {SERVICES.map(s => (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b border-blue-50 last:border-0">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.online ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'}`} />
                        {s.name}
                      </div>
                      <span className={`text-xs font-bold ${s.online ? 'text-green-600' : 'text-yellow-600'}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-blue-50 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Last checked</div>
                  <div className="font-semibold text-slate-700 text-sm">{lastChecked}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ════ MODALS ════ */}

      {/* Add Product */}
      {showAddProduct && (
        <Modal title="➕ Add New Product" onClose={() => setShowAddProduct(false)}>
          <div className="space-y-4">
            <Field label="Product Name">
              <input className={inputCls} placeholder="e.g. White Linen Shirt"
                value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select className={inputCls} value={newProduct.category}
                  onChange={e => {
                    const emojis: Record<string, string> = { shirts: '👕', shoes: '👟', pants: '👖' }
                    setNewProduct(p => ({ ...p, category: e.target.value, emoji: emojis[e.target.value] || '📦' }))
                  }}>
                  <option value="shirts">Shirts</option>
                  <option value="shoes">Shoes</option>
                  <option value="pants">Pants</option>
                </select>
              </Field>
              <Field label="Price (RM)">
                <input className={inputCls} type="number" placeholder="0.00"
                  value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
              </Field>
            </div>
            <Field label="Stock Quantity">
              <input className={inputCls} type="number" placeholder="0"
                value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
            </Field>
          </div>
          <ModalFooter onCancel={() => setShowAddProduct(false)} onSave={addProduct} saveLabel="Add Product" saving={saving} />
        </Modal>
      )}

      {/* Edit Product */}
      {editingProduct && (
        <Modal title="✏️ Edit Product" onClose={() => setEditingProduct(null)}>
          <div className="space-y-4">
            <Field label="Product Name">
              <input className={inputCls} value={editingProduct.name}
                onChange={e => setEditingProduct(p => p ? { ...p, name: e.target.value } : p)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (RM)">
                <input className={inputCls} type="number" value={editingProduct.price}
                  onChange={e => setEditingProduct(p => p ? { ...p, price: parseFloat(e.target.value) } : p)} />
              </Field>
              <Field label="Stock Quantity">
                <input className={inputCls} type="number" value={editingProduct.stock}
                  onChange={e => setEditingProduct(p => p ? { ...p, stock: parseInt(e.target.value) } : p)} />
              </Field>
            </div>
          </div>
          <ModalFooter onCancel={() => setEditingProduct(null)} onSave={saveEditProduct} saveLabel="Save Changes" saving={saving} />
        </Modal>
      )}

      {/* Edit Order */}
      {editingOrder && (
        <Modal title={`✏️ Edit Order ${editingOrder.id}`} onClose={() => setEditingOrder(null)}>
          <div className="space-y-4">
            <Field label="Update Status">
              <select className={inputCls} value={editOrderForm.status}
                onChange={e => setEditOrderForm(f => ({ ...f, status: e.target.value }))}>
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Delivery Address">
              <input className={inputCls} value={editOrderForm.address}
                onChange={e => setEditOrderForm(f => ({ ...f, address: e.target.value }))} />
            </Field>
            <Field label="Admin Note">
              <textarea className={`${inputCls} h-20 resize-none`} placeholder="Add a note..."
                value={editOrderForm.note}
                onChange={e => setEditOrderForm(f => ({ ...f, note: e.target.value }))} />
            </Field>
          </div>
          <ModalFooter onCancel={() => setEditingOrder(null)} onSave={saveOrder} saveLabel="Save Changes" saving={saving} />
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-blue-700 text-white px-6 py-3.5 rounded-xl shadow-xl font-semibold text-sm z-50">
          ✅ {toast}
        </div>
      )}

      {/* Back to top */}
      <a href="#" className="fixed bottom-8 left-8 w-11 h-11 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition text-lg z-40">↑</a>
    </div>
  )
}

/* ════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════ */
function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xl">{icon}</span>
      <h2 className="text-xl font-bold text-blue-900">{title}</h2>
      <div className="flex-1 h-0.5 bg-blue-100 rounded" />
    </div>
  )
}

function ActionBtn({ color, onClick, label, title }: { color: string; onClick: () => void; label: string; title: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700',
    red:  'bg-red-50 hover:bg-red-100 text-red-600',
  }
  return (
    <button title={title} onClick={onClick} className={`px-2.5 py-1.5 rounded-lg text-sm transition ${colors[color]}`}>
      {label}
    </button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
          <h5 className="text-white font-bold">{title}</h5>
          <button onClick={onClose} className="text-white text-xl hover:opacity-70 transition">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onCancel, onSave, saveLabel, saving }: { onCancel: () => void; onSave: () => void; saveLabel: string; saving: boolean }) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button onClick={onCancel} className="px-5 py-2.5 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition">
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-500 transition'
