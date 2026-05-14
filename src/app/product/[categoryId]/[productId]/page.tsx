// app/product/[categoryId]/[productId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/productDetailView";
import { getCategoryById, getProductById } from "@/lib/productData";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    categoryId: string;
    productId: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { categoryId, productId } = await params;

  const category = getCategoryById(categoryId);
  const product = getProductById(categoryId, productId);

  if (!category || !product) {
    notFound();
  }

  const supabase = await createClient();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, product_id, category_id, size, colour, pattern, stock_quantity")
    .eq("product_id", product.id)
    .eq("category_id", categoryId);

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
        {/* Breadcrumb + back button row */}
        <div className="mb-6 flex items-center gap-4">
          {/* Back button */}
          <Link
            href={`/category/${category.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {category.name}
          </Link>

          <span className="text-zinc-300">|</span>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-zinc-400">
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
        </div>

        <ProductDetailView
          category={category}
          product={product}
          variants={variants ?? []}
        />
      </main>
    </div>
  );
}
