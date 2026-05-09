"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  getProductImageForSelection,
  type Category,
  type Product,
} from "@/lib/product-data";

type ProductDetailViewProps = {
  category: Category;
  product: Product;
};

type SelectorGroupProps = {
  label: string;
  options: string[];
  selectedOption: string;
  onChange: (option: string) => void;
};

function SelectorGroup({
  label,
  options,
  selectedOption,
  onChange,
}: SelectorGroupProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
        <span className="text-xs text-zinc-500">{selectedOption}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option === selectedOption;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

export function ProductDetailView({
  category,
  product,
}: ProductDetailViewProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [selectedColour, setSelectedColour] = useState(product.colours[0] ?? "");
  const [selectedPattern, setSelectedPattern] = useState(product.patterns[0] ?? "");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const activeImage = useMemo(
    () =>
      getProductImageForSelection({
        product,
        selectedColour,
        selectedPattern,
      }),
    [product, selectedColour, selectedPattern],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div
          className={`${category.color} flex min-h-[360px] items-center justify-center border-b border-zinc-200 p-8 sm:min-h-[440px] sm:p-10`}
        >
          {activeImage ? (
            <Image
              key={activeImage}
              src={activeImage}
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

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Product details</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Choose the combination that fits before handing this product off to cart.
          </p>
        </div>

        <div className="space-y-6">
          <SelectorGroup
            label="Size"
            options={product.sizes}
            selectedOption={selectedSize}
            onChange={setSelectedSize}
          />
          <SelectorGroup
            label="Colour"
            options={product.colours}
            selectedOption={selectedColour}
            onChange={setSelectedColour}
          />
          <SelectorGroup
            label="Pattern"
            options={product.patterns}
            selectedOption={selectedPattern}
            onChange={setSelectedPattern}
          />
        </div>

        <div className="mt-8 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p className="font-medium text-zinc-900">Current selection</p>
          <p className="mt-2">
            {selectedSize} / {selectedColour} / {selectedPattern}
          </p>
        </div>

        {product.sizePage ? (
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="mt-6 inline-flex items-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            View Size Guide
          </button>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            Size guide is not available for this product.
          </p>
        )}

        <button
          type="button"
          className="mt-6 inline-flex items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Add to Cart
        </button>
        {/* TODO: Hand off selected product options to cart flow. */}
      </section>

      {product.sizePage && isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
              <h2 id="size-guide-title" className="text-lg font-bold text-zinc-900">
                Size Guide
              </h2>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close size guide"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex max-h-[calc(90vh-73px)] items-center justify-center overflow-auto bg-zinc-50 p-4 sm:p-6">
              <Image
                src={product.sizePage}
                alt={`${product.name} size guide`}
                width={1200}
                height={900}
                className="h-auto max-h-[calc(90vh-121px)] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
