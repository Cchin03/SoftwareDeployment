'use client'

import { useState } from 'react'

const NAV_ITEMS = [
  {
    href: '#manage-products', label: 'Products',
    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>,
  },
  {
    href: '#manage-orders', label: 'Orders',
    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  },
  {
    href: '#server-monitor', label: 'Server Monitor',
    icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
  onLogout?: () => void
}

export default function Sidebar({ userName = 'Admin', userEmail = 'admin@shopkl.com', onLogout }: SidebarProps) {
  const [open, setOpen] = useState(true)

  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-17.5'}`}
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f2756 40%, #0d3b8e 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute bottom-24 left-0 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle at bottom left, rgba(124,112,255,0.14), transparent 70%)' }} />

        {/* ── Brand / Hamburger ── */}
        <div className="relative flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle sidebar"
            className="shrink-0 flex flex-col justify-center gap-1.25 w-6 h-6"
          >
            <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${open ? 'w-6 translate-y-1.75 rotate-45' : 'w-6'}`} />
            <span className={`block h-0.5 bg-white/70 rounded-full transition-all duration-300 ${open ? 'opacity-0 w-0' : 'w-4'}`} />
            <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${open ? 'w-6 -translate-y-1.75 -rotate-45' : 'w-5'}`} />
          </button>
          {open && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-wide whitespace-nowrap">ShopKL Admin</span>
            </div>
          )}
        </div>

        {/* ── Profile card ── */}
        <div className={`relative ${open ? 'mx-3 mt-5 mb-2' : 'flex justify-center mt-4 mb-2'}`}>
          {open ? (
            <div
              className="rounded-2xl p-3.5 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-emerald-400" style={{ borderColor: '#0f2756' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate leading-tight">{userName}</p>
                <p className="text-blue-300/70 text-[11px] truncate mt-0.5">{userEmail}</p>
              </div>
              <span
                className="shrink-0 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              >
                ADMIN
              </span>
            </div>
          ) : (
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} title={userName}>
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-emerald-400" style={{ borderColor: '#0f2756' }} />
            </div>
          )}
        </div>

        {/* ── Nav label ── */}
        {open && (
          <p className="px-5 mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(147,197,253,0.45)' }}>
            Main Menu
          </p>
        )}

        {/* ── Nav links ── */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-xl py-2.5 font-medium text-sm transition-all duration-200
                text-blue-200/80 hover:text-white
                ${open ? 'px-3.5' : 'justify-center px-0'}`}
              style={{ '--hover-bg': 'rgba(255,255,255,0.08)' } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="shrink-0 text-blue-300 group-hover:text-blue-100 transition-colors">
                {item.icon}
              </span>
              {open && <span className="truncate">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* ── Logout / footer ── */}
        <div className="relative px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {open ? (
            <div className="space-y-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-300/90 hover:text-red-200 transition-all text-sm font-medium"
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              <p className="text-center text-[10px]" style={{ color: 'rgba(147,197,253,0.3)' }}>Admin v1.0</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onLogout}
                title="Logout"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-300/80 hover:text-red-200 transition-all"
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`shrink-0 transition-all duration-300 ${open ? 'w-64' : 'w-17.5'}`} />
    </>
  )
}
