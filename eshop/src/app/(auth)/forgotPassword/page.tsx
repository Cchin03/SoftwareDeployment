'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link!')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-blue-50">

      {/* Left Panel */}
      <div className="hidden lg:flex w-105 bg-linear-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />

        {/* Brand */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">ShopFlow</span>
        </div>

        {/* Body text */}
        <div className="z-10">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide">
            Account Recovery
          </span>
          <h2 className="text-white text-3xl font-semibold leading-snug tracking-tight mb-3">
            Forgot your<br />password?
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            No worries — enter your email and we'll send you a reset link right away.
          </p>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center gap-2 z-10">
          <div className="w-2 h-2 bg-white/30 rounded-full" />
          <div className="w-2 h-2 bg-white/30 rounded-full" />
          <div className="w-6 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1.5">
              Reset your password
            </h1>
            <p className="text-sm text-slate-500">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {message ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-center leading-relaxed">
              <div className="text-2xl mb-2">📬</div>
              {message}
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Remembered it?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 transition">
              Back to sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
