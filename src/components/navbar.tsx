'use client'

import Link from 'next/link'
import { logout } from '@/lib/authActions'

const NAV_CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home & Living' },
  { id: 'beauty', name: 'Beauty' },
]

interface NavbarUser {
  name: string
  email: string
}

interface NavbarProps {
  user: NavbarUser | null
  cartCount?: number
  onCartClick?: (e: React.MouseEvent) => void
  showCart?: boolean
  showLogo?: boolean
  showNavLinks?: boolean
}

export default function Navbar({
  user,
  cartCount = 0,
  onCartClick,
  showCart = true,
  showLogo = true,
  showNavLinks = true,
}: NavbarProps) {
  const isGuest = !user
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : ''

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        
        {/* Logo */}
        {showLogo && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              shop<span className="text-indigo-500">.</span>io
            </span>
          </Link>
        )}

        {/* Nav links */}
        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
            <Link href="/" className="text-zinc-900 font-semibold">Home</Link>
            {NAV_CATEGORIES.map(c => (
              <Link key={c.id} href={`/category/${c.id}`} className="hover:text-zinc-900 transition-colors">
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Cart */}
          {showCart && (
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
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              {isGuest && (
                <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">🔒</span>
              )}
            </Link>
          )}

          {/* Auth */}
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
            <div className="flex items-center gap-3">
              {/* Profile */}
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/95 text-white flex items-center justify-center font-bold text-sm">
                  {avatarLetter}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>

              {/* Logout — server action, clears cookie server-side */}
              <form action={logout}>
                <button
                  className="group flex items-center justify-start w-9 h-9 bg-black rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 shadow-lg hover:w-32 hover:rounded-lg active:translate-x-1 active:translate-y-1"
                >
                  <div
                    className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 512 512" fill="white">
                      <path
                        d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                      ></path>
                    </svg>
                  </div>
                  <div
                    className="absolute right-8 transform translate-x-full opacity-0 text-white transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    Logout
                  </div>
                </button>

              </form>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
