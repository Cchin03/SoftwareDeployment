// src/app/mnt/user-data/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

const categories = [
  {
    id: "electronics",
    name: "Electronics",
    description: "Phones, laptops, gadgets & more",
    icon: "⚡",
    color: "bg-sky-50 border-sky-200",
    accent: "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
    count: 142,
    featured: ["MacBook Pro", "AirPods", "iPhone 16"],
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, shoes & accessories",
    icon: "👗",
    color: "bg-rose-50 border-rose-200",
    accent: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    count: 381,
    featured: ["Sneakers", "Jackets", "Handbags"],
  },
  {
    id: "home",
    name: "Home & Living",
    description: "Furniture, décor & kitchen",
    icon: "🏠",
    color: "bg-amber-50 border-amber-200",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    count: 207,
    featured: ["Sofas", "Lighting", "Cookware"],
  },
  {
    id: "beauty",
    name: "Beauty",
    description: "Skincare, makeup & wellness",
    icon: "✨",
    color: "bg-fuchsia-50 border-fuchsia-200",
    accent: "text-fuchsia-600",
    badge: "bg-fuchsia-100 text-fuchsia-700",
    count: 165,
    featured: ["Serums", "Perfumes", "Sunscreen"],
  },
  {
    id: "sports",
    name: "Sports",
    description: "Gear, apparel & equipment",
    icon: "🏃",
    color: "bg-emerald-50 border-emerald-200",
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    count: 98,
    featured: ["Yoga Mats", "Dumbbells", "Running Shoes"],
  },
  {
    id: "books",
    name: "Books & Media",
    description: "Books, music & games",
    icon: "📚",
    color: "bg-violet-50 border-violet-200",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    count: 320,
    featured: ["Bestsellers", "Vinyl Records", "Board Games"],
  },
];

const deals = [
  { name: "Sony WH-1000XM5", price: "$279", was: "$349", category: "Electronics", img: "🎧" },
  { name: "Levi's 501 Jeans", price: "$59", was: "$89", category: "Fashion", img: "👖" },
  { name: "Dyson V15", price: "$549", was: "$699", category: "Home & Living", img: "🌀" },
  { name: "COSRX Serum", price: "$23", was: "$35", category: "Beauty", img: "🧴" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900">shop<span className="text-indigo-500">.</span>io</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
            <Link href="/" className="text-zinc-900 font-semibold">Home</Link>
            {categories.slice(0, 4).map(c => (
              <Link key={c.id} href={`/category/${c.id}`} className="hover:text-zinc-900 transition-colors">{c.name}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors">
              <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </Link>
            <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/signup" className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors hidden sm:block">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-4">
              🎉 New arrivals every week
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

      {/* Categories Grid */}
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
            {deals.map((d) => (
              <div key={d.name} className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                <div className="text-5xl mb-4 text-center py-4 bg-white rounded-xl border border-zinc-100">
                  {d.img}
                </div>
                <span className="text-xs text-zinc-400 font-medium">{d.category}</span>
                <h4 className="font-semibold text-zinc-900 mt-1 mb-2 text-sm">{d.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900">{d.price}</span>
                  <span className="text-sm text-zinc-400 line-through">{d.was}</span>
                </div>
                <button className="mt-3 w-full bg-zinc-900 text-white text-sm font-semibold py-2 rounded-xl hover:bg-zinc-700 transition-colors">
                  Add to cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-zinc-900 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Free shipping on orders over $50</h2>
            <p className="text-zinc-400 text-base">Plus free 30-day returns on all orders. No questions asked.</p>
          </div>
          <Link href="/signup" className="shrink-0 bg-white text-zinc-900 font-bold px-8 py-4 rounded-2xl text-sm hover:bg-zinc-100 transition-colors whitespace-nowrap">
            Create free account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold tracking-tight text-zinc-900">shop<span className="text-indigo-500">.</span>io</span>
          <p className="text-sm text-zinc-400">© 2026 shop.io — All rights reserved.</p>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-700">Privacy</a>
            <a href="#" className="hover:text-zinc-700">Terms</a>
            <a href="#" className="hover:text-zinc-700">Contact</a>
          </div>
        </div>
      </footer>
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
