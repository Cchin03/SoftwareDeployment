"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire up Supabase auth
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-zinc-900 inline-block">
            shop<span className="text-indigo-500">.</span>io
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-900">Welcome back</h1>
          <p className="mt-1 text-zinc-500 text-sm">Sign in to your account to continue</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-zinc-50"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-zinc-700">Password</label>
                <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-zinc-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="hover:text-zinc-600">Terms</a> and{" "}
          <a href="#" className="hover:text-zinc-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
