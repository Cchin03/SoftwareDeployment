"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const categoryData: Record<string, {
  name: string;
  icon: string;
  description: string;
  color: string;
  accent: string;
  products: { id: number; name: string; price: string; rating: number; reviews: number; emoji: string; tag?: string; }[];
}> = {
  electronics: {
    name: "Electronics",
    icon: "⚡",
    description: "The latest in tech — phones, laptops, audio & more.",
    color: "bg-sky-50 border-sky-200",
    accent: "text-sky-600",
    products: [
      { id: 1, name: "MacBook Pro 16\"", price: "$2,499", rating: 5, reviews: 1284, emoji: "💻", tag: "Best Seller" },
      { id: 2, name: "Sony WH-1000XM5", price: "$279", rating: 5, reviews: 876, emoji: "🎧", tag: "Sale" },
      { id: 3, name: "iPhone 16 Pro", price: "$1,099", rating: 5, reviews: 3021, emoji: "📱", tag: "New" },
      { id: 4, name: "iPad Pro M4", price: "$999", rating: 4, reviews: 512, emoji: "📲" },
      { id: 5, name: "Samsung QLED 55\"", price: "$799", rating: 4, reviews: 445, emoji: "📺" },
      { id: 6, name: "Apple Watch Ultra 2", price: "$799", rating: 5, reviews: 699, emoji: "⌚", tag: "New" },
      { id: 7, name: "Bose QuietComfort 45", price: "$229", rating: 4, reviews: 387, emoji: "🎶", tag: "Sale" },
      { id: 8, name: "DJI Mini 4 Pro", price: "$759", rating: 5, reviews: 234, emoji: "🚁" },
    ],
  },
  fashion: {
    name: "Fashion",
    icon: "👗",
    description: "Curated clothing, shoes & accessories for every style.",
    color: "bg-rose-50 border-rose-200",
    accent: "text-rose-600",
    products: [
      { id: 1, name: "Levi's 501 Jeans", price: "$59", rating: 5, reviews: 2891, emoji: "👖", tag: "Best Seller" },
      { id: 2, name: "Nike Air Force 1", price: "$110", rating: 5, reviews: 4102, emoji: "👟", tag: "Classic" },
      { id: 3, name: "Oversized Trench", price: "$149", rating: 4, reviews: 723, emoji: "🧥", tag: "Trending" },
      { id: 4, name: "Silk Slip Dress", price: "$89", rating: 4, reviews: 441, emoji: "👗" },
      { id: 5, name: "Canvas Tote Bag", price: "$35", rating: 5, reviews: 1120, emoji: "👜", tag: "New" },
      { id: 6, name: "Merino Wool Sweater", price: "$120", rating: 5, reviews: 632, emoji: "🧶" },
      { id: 7, name: "Aviator Sunglasses", price: "$75", rating: 4, reviews: 881, emoji: "🕶️" },
      { id: 8, name: "Gold Hoop Earrings", price: "$45", rating: 5, reviews: 556, emoji: "💍", tag: "Sale" },
    ],
  },
  home: {
    name: "Home & Living",
    icon: "🏠",
    description: "Transform your space with furniture, décor & kitchen essentials.",
    color: "bg-amber-50 border-amber-200",
    accent: "text-amber-600",
    products: [
      { id: 1, name: "Linen Sofa 3-Seat", price: "$899", rating: 5, reviews: 342, emoji: "🛋️", tag: "Best Seller" },
      { id: 2, name: "Dyson V15 Vacuum", price: "$549", rating: 5, reviews: 1203, emoji: "🌀", tag: "Sale" },
      { id: 3, name: "Coffee Maker Pro", price: "$129", rating: 4, reviews: 877, emoji: "☕" },
      { id: 4, name: "Pendant Light Set", price: "$199", rating: 4, reviews: 445, emoji: "💡", tag: "New" },
      { id: 5, name: "Cast Iron Dutch Oven", price: "$89", rating: 5, reviews: 2011, emoji: "🍲", tag: "Best Seller" },
      { id: 6, name: "Bamboo Bookshelf", price: "$249", rating: 4, reviews: 321, emoji: "📚" },
      { id: 7, name: "Smart Thermostat", price: "$179", rating: 5, reviews: 654, emoji: "🌡️", tag: "New" },
      { id: 8, name: "Scented Candle Set", price: "$49", rating: 5, reviews: 1440, emoji: "🕯️", tag: "Trending" },
    ],
  },
  beauty: {
    name: "Beauty",
    icon: "✨",
    description: "Skincare, makeup & wellness products you'll love.",
    color: "bg-fuchsia-50 border-fuchsia-200",
    accent: "text-fuchsia-600",
    products: [
      { id: 1, name: "COSRX HA Serum", price: "$23", rating: 5, reviews: 3421, emoji: "🧴", tag: "Best Seller" },
      { id: 2, name: "Vitamin C Moisturizer", price: "$42", rating: 5, reviews: 1102, emoji: "🍋", tag: "New" },
      { id: 3, name: "SPF50 Sunscreen", price: "$18", rating: 5, reviews: 2877, emoji: "☀️", tag: "Best Seller" },
      { id: 4, name: "Rose Face Mist", price: "$29", rating: 4, reviews: 654, emoji: "🌹" },
      { id: 5, name: "Retinol Night Cream", price: "$55", rating: 5, reviews: 1341, emoji: "🌙", tag: "Trending" },
      { id: 6, name: "Chanel No. 5 (50ml)", price: "$89", rating: 5, reviews: 4120, emoji: "🌸", tag: "Classic" },
      { id: 7, name: "Mascara Extreme", price: "$22", rating: 4, reviews: 891, emoji: "🪄" },
      { id: 8, name: "Lip Gloss Set", price: "$35", rating: 4, reviews: 702, emoji: "💄", tag: "Sale" },
    ],
  },
  sports: {
    name: "Sports",
    icon: "🏃",
    description: "Gear up with top-rated sports equipment & activewear.",
    color: "bg-emerald-50 border-emerald-200",
    accent: "text-emerald-600",
    products: [
      { id: 1, name: "Yoga Mat Pro", price: "$65", rating: 5, reviews: 2341, emoji: "🧘", tag: "Best Seller" },
      { id: 2, name: "Adjustable Dumbbells", price: "$189", rating: 5, reviews: 987, emoji: "🏋️", tag: "New" },
      { id: 3, name: "Running Shoes V2", price: "$130", rating: 5, reviews: 1450, emoji: "👟", tag: "Trending" },
      { id: 4, name: "Cycling Helmet", price: "$79", rating: 4, reviews: 556, emoji: "🚴" },
      { id: 5, name: "Resistance Bands Set", price: "$35", rating: 5, reviews: 3201, emoji: "💪", tag: "Best Seller" },
      { id: 6, name: "Swimming Goggles", price: "$29", rating: 4, reviews: 441, emoji: "🥽" },
      { id: 7, name: "Protein Powder 2kg", price: "$55", rating: 5, reviews: 2110, emoji: "💊", tag: "Sale" },
      { id: 8, name: "Jump Rope Pro", price: "$22", rating: 5, reviews: 1780, emoji: "⚡" },
    ],
  },
  books: {
    name: "Books & Media",
    icon: "📚",
    description: "Bestselling books, music, games & digital media.",
    color: "bg-violet-50 border-violet-200",
    accent: "text-violet-600",
    products: [
      { id: 1, name: "Atomic Habits", price: "$17", rating: 5, reviews: 12450, emoji: "📖", tag: "Best Seller" },
      { id: 2, name: "The Midnight Library", price: "$14", rating: 5, reviews: 5310, emoji: "🌙", tag: "Trending" },
      { id: 3, name: "Taylor Swift Vinyl", price: "$29", rating: 5, reviews: 3201, emoji: "🎵", tag: "New" },
      { id: 4, name: "Catan Board Game", price: "$44", rating: 5, reviews: 7821, emoji: "🎲", tag: "Classic" },
      { id: 5, name: "Dune (Boxed Set)", price: "$39", rating: 5, reviews: 4102, emoji: "🏜️" },
      { id: 6, name: "Art of War", price: "$9", rating: 4, reviews: 6711, emoji: "⚔️" },
      { id: 7, name: "Kindle Paperwhite", price: "$139", rating: 5, reviews: 9021, emoji: "📱", tag: "Best Seller" },
      { id: 8, name: "Jigsaw Puzzle 1000pc", price: "$18", rating: 4, reviews: 1201, emoji: "🧩", tag: "Sale" },
    ],
  },
};

const tagColors: Record<string, string> = {
  "Best Seller": "bg-amber-100 text-amber-700",
  "New": "bg-emerald-100 text-emerald-700",
  "Sale": "bg-red-100 text-red-700",
  "Trending": "bg-indigo-100 text-indigo-700",
  "Classic": "bg-zinc-100 text-zinc-700",
};

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Best Rated"];

export default function CategoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const cat = categoryData[id];

  const [cart, setCart] = useState<number[]>([]);
  const [sort, setSort] = useState("Featured");
  const [search, setSearch] = useState("");

  if (!cat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Category not found</h1>
          <Link href="/" className="text-indigo-600 hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const filtered = cat.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900">shop<span className="text-indigo-500">.</span>io</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
            {Object.entries(categoryData).slice(0, 5).map(([key, val]) => (
              <Link key={key} href={`/mnt/user-data/category/${key}`} className={`hover:text-zinc-900 transition-colors ${key === id ? "text-zinc-900 font-semibold" : ""}`}>
                {val.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/mnt/user-data/cart" className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors">
              <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>
              )}
            </Link>
            <Link href="/mnt/user-data/login/" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 hidden sm:block">Sign in</Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <nav className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">{cat.name}</span>
        </nav>
      </div>

      {/* Category header */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-8`}>
        <div className={`${cat.color} rounded-2xl border p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{cat.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900">{cat.name}</h1>
              <p className="text-zinc-500 mt-1">{cat.description}</p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${cat.accent} bg-white/70 px-4 py-2 rounded-full border border-white`}>
            {cat.products.length} products
          </span>
        </div>
      </section>

      {/* Filters + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Sort:</span>
            <div className="flex gap-1">
              {sortOptions.map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${sort === s ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <span className="text-4xl block mb-3">🔍</span>
            No products match &quot;{search}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const inCart = cart.includes(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative bg-zinc-50 py-8 flex items-center justify-center text-6xl">
                    {product.emoji}
                    {product.tag && (
                      <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColors[product.tag] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {product.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-zinc-900 text-sm mb-1 leading-snug">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < product.rating ? "text-amber-400" : "text-zinc-200"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400">({product.reviews.toLocaleString()})</span>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="font-bold text-zinc-900">{product.price}</span>
                      <button
                        onClick={() => setCart(prev => inCart ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${inCart ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}
                      >
                        {inCart ? "✓ Added" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm font-medium">
            <span>{cart.length} item{cart.length > 1 ? "s" : ""} in cart</span>
            <Link href="/mnt/user-data/cart" className="bg-white text-zinc-900 px-4 py-1.5 rounded-xl font-semibold hover:bg-zinc-100 transition-colors text-xs">
              View Cart →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
