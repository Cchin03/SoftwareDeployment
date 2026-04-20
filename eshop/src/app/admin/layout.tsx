'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-blue-50 font-sans">

      {/* Topbar */}
      <div className="hidden lg:block bg-blue-700 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6 text-white text-xs">
            <span>📍 123 Street, Kuala Lumpur</span>
            <span>✉️ admin@shopkl.com</span>
          </div>
          <div className="flex gap-4 text-white text-xs">
            <Link href="#" className="hover:text-yellow-300 transition">Privacy Policy</Link>
            <span className="opacity-40">|</span>
            <Link href="#" className="hover:text-yellow-300 transition">Terms of Use</Link>
            <span className="opacity-40">|</span>
            <Link href="#" className="hover:text-yellow-300 transition">Support</Link>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/admin/dashboard" className="text-blue-700 text-2xl font-bold tracking-tight">
            ShopKL
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Dashboard', href: '/admin/dashboard' },
              { label: 'Products', href: '/admin/dashboard#manage-products' },
              { label: 'Orders', href: '/admin/dashboard#manage-orders' },
              { label: 'Server', href: '/admin/dashboard#server-monitor' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-5 text-sm font-semibold text-slate-700 hover:text-blue-700 hover:border-b-2 hover:border-blue-700 transition"
              >
                {item.label}
              </Link>
            ))}
            <span className="ml-2 bg-blue-700 text-white text-xs font-bold px-3 py-0.5 rounded-full">ADMIN</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-blue-700 hover:bg-blue-50 transition">
              🔔
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">Chin (Admin)</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-semibold transition ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="bg-blue-900 text-white/70 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2">ShopKL</h2>
              <p className="text-sm">Admin control panel for managing your e-commerce store efficiently.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="#manage-products" className="block hover:text-yellow-300 transition">Manage Products</Link>
                <Link href="#manage-orders" className="block hover:text-yellow-300 transition">Manage Orders</Link>
                <Link href="#server-monitor" className="block hover:text-yellow-300 transition">Server Monitor</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Admin Tools</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="block hover:text-yellow-300 transition">Sales Reports</Link>
                <Link href="#" className="block hover:text-yellow-300 transition">Settings</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <p className="text-sm">123 Admin St, KL</p>
              <p className="text-sm">admin@shopkl.com</p>
              <p className="text-sm">+603 1234 5678</p>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row justify-between text-xs gap-2">
            <span>© 2026 ShopKL Admin. All rights reserved.</span>
            <span>Built for E-Commerce Group Assignment</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
