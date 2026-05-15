'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cartActions'
import Navbar from '@/components/navbar'

const categories = [
  {
    id: 'electronics', name: 'Electronics', description: 'Phones, laptops, gadgets & more',
    icon: '⚡', color: 'bg-sky-50 border-sky-200', accent: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700', count: 142, featured: ['MacBook Pro', 'AirPods', 'iPhone 16'],
  },
  {
    id: 'fashion', name: 'Fashion', description: 'Clothing, shoes & accessories',
    icon: '👗', color: 'bg-rose-50 border-rose-200', accent: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700', count: 381, featured: ['Sneakers', 'Jackets', 'Handbags'],
  },
  {
    id: 'home', name: 'Home & Living', description: 'Furniture, décor & kitchen',
    icon: '🏠', color: 'bg-amber-50 border-amber-200', accent: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700', count: 207, featured: ['Sofas', 'Lighting', 'Cookware'],
  },
  {
    id: 'beauty', name: 'Beauty', description: 'Skincare, makeup & wellness',
    icon: '✨', color: 'bg-fuchsia-50 border-fuchsia-200', accent: 'text-fuchsia-600',
    badge: 'bg-fuchsia-100 text-fuchsia-700', count: 165, featured: ['Serums', 'Perfumes', 'Sunscreen'],
  },
  {
    id: 'sports', name: 'Sports', description: 'Gear, apparel & equipment',
    icon: '🏃', color: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700', count: 98, featured: ['Yoga Mats', 'Dumbbells', 'Running Shoes'],
  },
  {
    id: 'books', name: 'Books & Media', description: 'Books, music & games',
    icon: '📚', color: 'bg-violet-50 border-violet-200', accent: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700', count: 320, featured: ['Bestsellers', 'Vinyl Records', 'Board Games'],
  },
]

// Map each deal to a real product_id + category_id from your productData.
// These must match the ids in your productData and product_variants table.
const DEALS_CONFIG = [
  { productId: 'sony-wh-1000xm5', categoryId: 'electronics', name: 'Sony WH-1000XM5', price: 'RM 279', was: 'RM 349', img: '🎧' },
  { productId: 'levis-501', categoryId: 'fashion', name: "Levi's 501 Jeans",  price: 'RM 59',  was: 'RM 89',  img: '👖' },
  { productId: 'dyson-v15', categoryId: 'home', name: 'Dyson V15', price: 'RM 549', was: 'RM 699', img: '🌀' },
  { productId: 'cosrx-serum', categoryId: 'beauty', name: 'COSRX Serum', price: 'RM 23',  was: 'RM 35',  img: '🧴' },
]

type DealFeedback = 'idle' | 'pending' | 'success' | 'error' | 'stock' | 'auth'

// Per-deal state: variantId + button feedback
type DealState = {
  variantId: string | null   
  feedback: DealFeedback
}

export default function ShopDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [isGuest, setIsGuest] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Per-deal state: variantId + button feedback
  const [dealStates, setDealStates] = useState<Record<string, DealState>>(
    () => Object.fromEntries(DEALS_CONFIG.map(d => [d.productId, { variantId: null, feedback: 'idle' }]))
  )

  function setDealState(productId: string, patch: Partial<DealState>) {
    setDealStates(prev => ({ ...prev, [productId]: { ...prev[productId], ...patch } }))
  }

  useEffect(() => {
    async function init() {
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser()
      const loggedIn = !!user && !user.is_anonymous
      setIsGuest(!loggedIn)

      if (loggedIn) {
        const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', user!.id)
        setCartCount((data ?? []).reduce((sum, row) => sum + row.quantity, 0))
      }

      // 2. Fetch the first available variant for each deal product
      await Promise.all(
        DEALS_CONFIG.map(async (deal) => {
          const { data } = await supabase
            .from('product_variants')
            .select('id, stock_quantity')
            .eq('product_id', deal.productId)
            .eq('category_id', deal.categoryId)
            .gt('stock_quantity', 0)   // only in-stock variants
            .order('stock_quantity', { ascending: false })
            .limit(1)
            .maybeSingle()

          setDealState(deal.productId, { variantId: data?.id ?? '' })
        })
      )
    }
    init()
  }, [])

  function handleCartClick(e: React.MouseEvent) {
    if (isGuest) {
      e.preventDefault()
      setShowModal(true)
    }
  }

  async function handleAddToCart(productId: string) {
    if (isGuest) {
      setShowModal(true)
      return
    }

    const { variantId } = dealStates[productId]
    if (!variantId) return  // out of stock or not loaded

    setDealState(productId, { feedback: 'pending' })
    try {
      await addToCart(variantId, 1)
      setCartCount(c => c + 1)
      setDealState(productId, { feedback: 'success' })
      setTimeout(() => setDealState(productId, { feedback: 'idle' }), 2500)
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? ''
      if (msg.includes('logged in')) {
        setDealState(productId, { feedback: 'auth' })
        setShowModal(true)
      } else if (msg.includes('out of stock')) {
        setDealState(productId, { feedback: 'stock' })
        setTimeout(() => setDealState(productId, { feedback: 'idle' }), 2500)
      } else {
        setDealState(productId, { feedback: 'error' })
        setTimeout(() => setDealState(productId, { feedback: 'idle' }), 2500)
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">

      <Navbar isGuest={isGuest} cartCount={cartCount} onCartClick={handleCartClick} />

      {/* ── Hero  */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-4">
              New arrivals every week
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-tight mb-5">
              Everything you<br />need, delivered.
            </h1>
            <p className="text-lg text-zinc-500 mb-8 max-w-lg">
              Browse thousands of products across six curated categories. Fast shipping, easy returns.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/category/electronics" className="bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-zinc-700 transition-colors">
                Shop now
              </Link>
              <Link href="#categories" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1">
                Browse categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Shop by Category</h2>
            <p className="text-sm text-zinc-500 mt-1">Find exactly what you&apos;re looking for</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={`group relative rounded-2xl border p-6 ${cat.color} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{cat.icon}</div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badge}`}>
                  {cat.count} items
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 text-lg mb-1">{cat.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{cat.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.featured.map((f) => (
                  <span key={f} className="text-xs bg-white/70 text-zinc-600 px-2 py-0.5 rounded-full border border-white/50">
                    {f}
                  </span>
                ))}
              </div>
              <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${cat.accent} group-hover:gap-2 transition-all`}>
                Browse {cat.name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Deals */}
      <section className="bg-white border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Today&apos;s Deals</h2>
              <p className="text-sm text-zinc-500 mt-1">Limited time offers — don&apos;t miss out</p>
            </div>
            <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full flex items-center gap-1">
              🔥 Ends in 6h
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEALS_CONFIG.map((deal) => {
              const state = dealStates[deal.productId]
              const isLoading = state.variantId === null
              const outOfStock = state.variantId === ''
              const feedback = state.feedback

              const btnDisabled = isGuest
                ? false  // guests see "sign in" prompt, button still clickable
                : isLoading || outOfStock || feedback === 'pending'

              return (
                <div key={deal.productId} className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <Link href={`/product/${deal.categoryId}/${deal.productId}`}>
                    <div className="text-5xl mb-4 text-center py-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-300 transition-colors">
                      {deal.img}
                    </div>
                  </Link>

                  <Link href={`/product/${deal.categoryId}/${deal.productId}`} className="hover:text-indigo-600 transition-colors">
                    <h4 className="font-semibold text-zinc-900 mt-1 mb-2 text-sm">{deal.name}</h4>
                  </Link>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-zinc-900">{deal.price}</span>
                    <span className="text-sm text-zinc-400 line-through">{deal.was}</span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(deal.productId)}
                    disabled={btnDisabled}
                    className={`w-full text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isGuest
                        ? 'bg-zinc-200 text-zinc-500'
                        : feedback === 'success'
                        ? 'bg-green-600 text-white'
                        : feedback === 'error'
                        ? 'bg-red-600 text-white'
                        : feedback === 'stock' || outOfStock
                        ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                        : 'bg-zinc-900 text-white hover:bg-zinc-700 cursor-pointer'
                    }`}
                  >
                    {isGuest ? (
                      <>🔒 Sign in to add</>
                    ) : isLoading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Loading…
                      </>
                    ) : feedback === 'pending' ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Adding…
                      </>
                    ) : feedback === 'success' ? (
                      <>✓ Added to cart!</>
                    ) : feedback === 'error' ? (
                      <>Something went wrong</>
                    ) : outOfStock || feedback === 'stock' ? (
                      <>Out of Stock</>
                    ) : (
                      <>Add to Cart</>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-zinc-900 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Free shipping on orders over RM 50
            </h2>
            <p className="text-zinc-400 text-base">Plus free 30-day returns on all orders. No questions asked.</p>
          </div>
          <Link href="/register" className="shrink-0 bg-white text-zinc-900 font-bold px-8 py-4 rounded-2xl text-sm hover:bg-zinc-100 transition-colors whitespace-nowrap">
            Create free account →
          </Link>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold tracking-tight text-zinc-900">shop<span className="text-indigo-500">.</span>io</span>
          <p className="text-sm text-zinc-400">© 2026 shop.io — All rights reserved. v1.0.0</p>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-700">Privacy</a>
            <a href="#" className="hover:text-zinc-700">Terms</a>
            <a href="#" className="hover:text-zinc-700">Contact</a>
          </div>
        </div>
      </footer>

      {/* Sign-in */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Sign in required</h2>
            <p className="text-sm text-zinc-500 mb-6">You need an account to add items to your cart.</p>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full bg-zinc-900 text-white text-sm font-semibold py-3 rounded-xl text-center hover:bg-zinc-700 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="w-full border border-zinc-200 text-zinc-700 text-sm font-semibold py-3 rounded-xl text-center hover:bg-zinc-50 transition-colors">
                Create account
              </Link>
              <button onClick={() => setShowModal(false)} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
