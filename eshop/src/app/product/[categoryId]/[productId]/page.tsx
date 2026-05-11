import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/productDetailView";
import { getCategoryById, getProductById } from "@/lib/productData";

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

        <ProductDetailView category={category} product={product} />
      </main>
    </div>
  );
}
