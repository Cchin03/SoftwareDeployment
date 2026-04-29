import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailsSelector } from "@/components/product-details-selector";
import { getCategoryById, getProductById } from "@/lib/product-data";

type ProductPageProps = {
  params: Promise<{
    categoryId: string;
    productId: string;
  }>;
};

function RatingSummary({
  rating,
  reviews,
}: {
  rating?: number;
  reviews?: number;
}) {
  if (typeof rating !== "number" || typeof reviews !== "number") {
    return <p className="text-sm text-zinc-500">Rating data not available yet.</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            className={`h-4 w-4 ${index < rating ? "text-amber-400" : "text-zinc-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        {rating.toFixed(1)} rating · {reviews.toLocaleString()} reviews
      </p>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { categoryId, productId } = await params;
  const category = getCategoryById(categoryId);
  const product = getProductById(categoryId, productId);

  if (!category || !product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            shop<span className="text-indigo-500">.</span>io
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/category/${category.id}`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Back to {category.name}
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="transition-colors hover:text-zinc-600">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/category/${category.id}`}
            className="transition-colors hover:text-zinc-600"
          >
            {category.name}
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-700">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div
              className={`${category.color} flex min-h-[360px] items-center justify-center border-b border-zinc-200 p-8 sm:min-h-[440px] sm:p-10`}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={720}
                  height={720}
                  priority
                  className="h-[260px] w-full max-w-[420px] object-contain sm:h-[360px]"
                />
              ) : (
                <span className="text-[8rem]" aria-hidden="true">
                  {product.emoji ?? "\u{1F6CD}"}
                </span>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
                {product.brand}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold text-zinc-900 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 text-lg font-semibold text-zinc-900">{product.price}</p>
              <div className="mt-5">
                <RatingSummary rating={product.rating} reviews={product.reviews} />
              </div>

              <dl className="mt-8 grid gap-4 rounded-2xl bg-zinc-50 p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Style
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">{product.style}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                    Brand
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-900">{product.brand}</dd>
                </div>
              </dl>

              <section className="mt-8">
                <h2 className="text-lg font-bold text-zinc-900">Description</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                  {product.description}
                </p>
              </section>
            </div>
          </section>

          <ProductDetailsSelector product={product} />
        </div>
      </main>
    </div>
  );
}
