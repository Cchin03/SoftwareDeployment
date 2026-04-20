import Link from "next/link";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            shop<span className="text-indigo-500">.</span>io
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Your Cart</h1>
        <p className="text-zinc-500 text-sm mb-10">Review your items before checkout</p>
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <span className="text-5xl block mb-4">🛒</span>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h2>
          <p className="text-zinc-500 text-sm mb-6">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-zinc-700 transition-colors">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
