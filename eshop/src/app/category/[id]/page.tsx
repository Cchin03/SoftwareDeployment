"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(storedCart.map((item: any) => item.id));
  }, []);

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

  const filtered = cat.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const item = {
      id: product.id,
      categoryId: id,
      variantId: product.id,
      name: product.name,
      price: Number(product.price.replace(/[^0-9.]/g, "")),
      quantity: 1,
    };

    const found = existingCart.find((cartItem: any) => cartItem.id === product.id);

    let updatedCart;

    if (found) {
      updatedCart = existingCart.map((cartItem: any) =>
        cartItem.id === product.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...existingCart, item];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart.map((item: any) => item.id));
    alert("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              shop<span className="text-indigo-500">.</span>io
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
            {Object.entries(categoryData).map(([key, val]) => (
              <Link
                key={key}
                href={`/category/${key}`}
                className={`hover:text-zinc-900 transition-colors ${
                  key === id ? "text-zinc-900 font-semibold" : ""
                }`}
              >
                {val.name}
              </Link>
            ))}
          </nav>

          <Link href="/cart" className="relative p-2 rounded-full hover:bg-zinc-100">
            🛒
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <nav className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">Home</Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">{cat.name}</span>
        </nav>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-8">
        <div className={`${cat.color} rounded-2xl border p-8 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{cat.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900">{cat.name}</h1>
              <p className="text-zinc-500 mt-1">{cat.description}</p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${cat.accent} bg-white/70 px-4 py-2 rounded-full`}>
            {cat.products.length} products
          </span>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl w-full sm:w-72"
          />

          <div className="flex gap-1">
            {sortOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-xs font-medium px-3 py-2 rounded-lg ${
                  sort === s
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 border border-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
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
                    <h3 className="font-semibold text-zinc-900 text-sm mb-1">
                      {product.name}
                    </h3>

                    <p className="text-xs text-zinc-400 mb-2">
                      Rating: {product.rating}/5 ({product.reviews})
                    </p>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="font-bold text-zinc-900">{product.price}</span>

                      <button
                        onClick={() => addToCart(product)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                          inCart
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-900 text-white hover:bg-zinc-700"
                        }`}
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

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm font-medium">
            <span>{cart.length} item{cart.length > 1 ? "s" : ""} in cart</span>
            <Link href="/cart" className="bg-white text-zinc-900 px-4 py-1.5 rounded-xl font-semibold text-xs">
              View Cart →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
