"use client";

import { useState } from "react";

import type { Product } from "@/lib/product-data";

type ProductDetailsSelectorProps = {
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

export function ProductDetailsSelector({ product }: ProductDetailsSelectorProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [selectedColour, setSelectedColour] = useState(product.colours[0] ?? "");
  const [selectedPattern, setSelectedPattern] = useState(product.patterns[0] ?? "");

  return (
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

      <button
        type="button"
        className="mt-6 inline-flex items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
      >
        Add to Cart
      </button>
      {/* TODO: Hand off selected product options to cart flow. */}
    </section>
  );
}
