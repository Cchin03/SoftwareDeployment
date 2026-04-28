'use client'

import Link from 'next/link'

const NAV_CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home & Living' },
  { id: 'beauty', name: 'Beauty'},
]

interface NavbarProps {
  isGuest: boolean
  cartCount: number
  onCartClick: (e: React.MouseEvent) => void
  onLogout: () => void
}

export default function Navbar({ isGuest, cartCount, onCartClick, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            shop<span className="text-indigo-500">.</span>io
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
          <Link href="/" className="text-zinc-900 font-semibold">Home</Link>
          {NAV_CATEGORIES.map(c => (
            <Link key={c.id} href={`/category/${c.id}`} className="hover:text-zinc-900 transition-colors">
              {c.name}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Cart */}
          <Link
            href={isGuest ? '#' : '/cart'}
            onClick={onCartClick}
            className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors"
            title={isGuest ? 'Sign in to access cart' : 'Cart'}
          >
            <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
            {isGuest && (
              <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">🔒</span>
            )}
          </Link>

          {/* Auth buttons */}
          {isGuest ? (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/register" className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors hidden sm:block">
                Get started
              </Link>
            </>
          ) : (
            <button
              onClick={onLogout}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors hidden sm:block"
            >
              Logout
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
