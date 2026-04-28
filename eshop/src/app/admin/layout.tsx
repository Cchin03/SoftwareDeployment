'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const supabase = createClient()

  const [userName,  setUserName]  = useState('Admin')
  const [userEmail, setUserEmail] = useState('admin@shopkl.com')

  /* ── Fetch logged-in user info ── */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? 'admin@shopkl.com')
        const name =
          user.user_metadata?.full_name ??
          user.email?.split('@')[0] ??
          'Admin'
        setUserName(name)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-blue-50 font-sans">

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* ── FOOTER ── */}
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
                  <Link href="#manage-orders"   className="block hover:text-yellow-300 transition">Manage Orders</Link>
                  <Link href="#server-monitor"  className="block hover:text-yellow-300 transition">Server Monitor</Link>
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
    </div>
  )
}
