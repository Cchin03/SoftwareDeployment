"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  getCategoryById,
  parsePrice,
  productCategories,
  sortOptions,
  tagColors,
  type Product,
  type SortOption,
} from "@/lib/productData";

function sortProducts(products: Product[], sort: SortOption) {
  const nextProducts = [...products];

  switch (sort) {
    case "Price: Low to High":
      return nextProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    case "Price: High to Low":
      return nextProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    case "Best Rated":
      return nextProducts.sort((a, b) => {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }

        return (b.reviews ?? 0) - (a.reviews ?? 0);
      });
    case "Featured":
    default:
      return nextProducts;
  }
}

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const category = getCategoryById(id);

  const [cart, setCart] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("Featured");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!category) {
      return [];
    }

    const matchingProducts = category.products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()),
    );

    return sortProducts(matchingProducts, sort);
  }, [category, search, sort]);

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Category not found</h1>
          <Link href="/" className="text-indigo-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              shop<span className="text-indigo-500">.</span>io
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-500 md:flex">
            {Object.entries(productCategories)
              .slice(0, 5)
              .map(([key, value]) => (
                <Link
                  key={key}
                  href={`/category/${key}`}
                  className={`transition-colors hover:text-zinc-900 ${key === id ? "font-semibold text-zinc-900" : ""
                    }`}
                >
                  {value.name}
                </Link>
              ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative rounded-full p-2 transition-colors hover:bg-zinc-100">
              <svg className="h-5 w-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cart.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link href="/admin/login/" className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="transition-colors hover:text-zinc-600">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-700">{category.name}</span>
        </nav>
      </div>

      <section className="mx-auto mt-4 mb-8 max-w-7xl px-4 sm:px-6">
        <div className={`${category.color} flex flex-col items-start justify-between gap-4 rounded-2xl border p-8 sm:flex-row sm:items-center`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900">{category.name}</h1>
              <p className="mt-1 text-zinc-500">{category.description}</p>
            </div>
          </div>
          <span className={`rounded-full border border-white bg-white/70 px-4 py-2 text-sm font-semibold ${category.accent}`}>
            {category.products.length} products
          </span>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-4 pl-9 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Sort:</span>
            <div className="flex gap-1">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSort(option)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${sort === option
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <span className="mb-3 block text-4xl">No results</span>
            No products match &quot;{search}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const inCart = cart.includes(product.id);
              const rating = product.rating ?? 0;
              const reviews = product.reviews ?? 0;
              const hasRating = typeof product.rating === "number" && typeof product.reviews === "number";

              return (
                <div
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={`/product/${category.id}/${product.id}`}
                    className="group flex flex-1 flex-col"
                  >
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-zinc-50 p-6 text-6xl">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={320}
                          height={320}
                          priority={index < 4}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span aria-hidden="true">{product.emoji ?? "\u{1F6CD}"}</span>
                      )}
                      {product.tag && (
                        <span
                          className={`absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${tagColors[product.tag] ?? "bg-zinc-100 text-zinc-600"
                            }`}
                        >
                          {product.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                        {product.brand}
                      </p>
                      <h3 className="mb-1 text-sm font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-indigo-600">
                        {product.name}
                      </h3>
                      <p className="mb-2 text-xs text-zinc-500">{product.style}</p>
                      {hasRating && (
                        <div className="mb-2 flex items-center gap-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <svg
                                key={index}
                                className={`h-3 w-3 ${index < rating ? "text-amber-400" : "text-zinc-200"
                                  }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-zinc-400">
                            ({reviews.toLocaleString()})
                          </span>
                        </div>
                      )}
                      <div className="mt-auto pt-2">
                        <span className="font-bold text-zinc-900">{product.price}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-end px-4 pb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCart((previous) =>
                          inCart
                            ? previous.filter((productId) => productId !== product.id)
                            : [...previous, product.id],
                        )
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${inCart
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-zinc-900 text-white hover:bg-zinc-700"
                        }`}
                    >
                      {inCart ? "Added" : "Add to cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-xl">
            <span>
              {cart.length} item{cart.length > 1 ? "s" : ""} in cart
            </span>
            <Link
              href="/cart"
              className="rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
