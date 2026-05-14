"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/lib/cartActions";

type Props = {
  initialItems: CartItem[];
  /** Pass the last-visited category id so the back button can go there directly.
   *  e.g. read from a cookie / localStorage in the parent server component, or
   *  derive from the first cart item's category_id if your CartItem has it.
   *  Falls back to "/" if omitted. */
  backHref?: string;
};

export function CartClient({ initialItems, backHref = "/" }: Props) {
  const router = useRouter();
  const {
    items,
    totalItems,
    totalPrice,
    isPending,
    handleUpdateQuantity,
    handleRemove,
    handleClear,
  } = useCart(initialItems);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Back button */}
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ← Continue shopping
        </button>

        <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Your Cart</h1>
        <p className="text-zinc-500 text-sm mb-10">Review your items before checkout</p>
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <span className="text-5xl block mb-4">🛒</span>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Looks like you haven&apos;t added anything yet.
          </p>
          <button
            onClick={() => router.push(backHref)}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            ← Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Back button */}
      <button
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
          ← Continue shopping
      </button>

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900">Your Cart</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={handleClear}
          disabled={isPending}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items list */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              isPending={isPending}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Order summary sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-zinc-600">
                  <span className="truncate max-w-45">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-medium text-zinc-800">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 pt-4 mb-6">
              <div className="flex justify-between font-bold text-zinc-900 text-base">
                <span>Total</span>
                <span>RM {totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Shipping calculated at checkout</p>
            </div>

            {/* Checkout button */}
            <Link
              href="/checkout"
              className="w-full block text-center bg-indigo-600 text-white py-3 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Proceed to Checkout →
            </Link>

            <button
              onClick={() => router.push(backHref)}
              className="w-full mt-3 text-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Continue shopping
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Sub-components
type CartRowProps = {
  item: CartItem;
  isPending: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
};

function CartRow({ item, isPending, onUpdateQuantity, onRemove }: CartRowProps) {
  const badges = [item.size, item.colour, item.pattern].filter(Boolean);
  const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 3;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-4 items-start">
      {/* Clicking the image/name goes back to the product page */}
      <Link
        href={`/product/${item.category_id}/${item.product_id}`}
        className="w-20 h-20 rounded-xl bg-zinc-100 overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
      >
        {item.image ? (
          <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
        )}
      </Link>

      {/* Product details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.category_id}/${item.product_id}`}
          className="font-semibold text-zinc-900 truncate block hover:text-indigo-600 transition-colors"
        >
          {item.product_name}
        </Link>
        {item.brand && <p className="text-xs text-zinc-400 mb-1">{item.brand}</p>}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {badges.map((badge) => (
              <span key={badge} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">
                {badge}
              </span>
            ))}
          </div>
        )}

        <p className="text-indigo-600 font-bold text-sm mt-1">RM {item.price.toFixed(2)}</p>

        {isLowStock && (
          <p className="text-xs text-amber-500 font-medium mt-0.5">Only {item.stock_quantity} left!</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="flex items-center gap-2 border border-zinc-200 rounded-full px-1 py-0.5">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isPending}
            aria-label="Decrease quantity"
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40 text-lg leading-none"
          >−</button>
          <span className="w-6 text-center text-sm font-semibold text-zinc-900">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isPending || item.quantity >= item.stock_quantity}
            aria-label="Increase quantity"
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40 text-lg leading-none"
          >+</button>
        </div>

        <p className="text-xs text-zinc-400 font-medium">RM {(item.price * item.quantity).toFixed(2)}</p>

        <button
          onClick={() => onRemove(item.id)}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
