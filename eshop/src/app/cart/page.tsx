"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

type CartItem = {
  id: number | string;
  categoryId?: number | string;
  variantId?: number | string;
  name: string;
  price: number;
  quantity: number;
};

const CART_EVENT = "cart-updated";

const getCartSnapshot = () =>
  typeof window === "undefined" ? "[]" : localStorage.getItem("cart") || "[]";

const subscribeToCart = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
};

const parseCart = (snapshot: string): CartItem[] => {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function CartPage() {
  const cartSnapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => "[]");
  const cart = useMemo(() => parseCart(cartSnapshot), [cartSnapshot]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const saveCart = (updatedCart: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event(CART_EVENT));
  };

  const updateQuantity = (id: CartItem["id"], change: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    );

    saveCart(updatedCart);
  };

  const removeItem = (id: CartItem["id"]) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-black sm:p-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-600">
            <p className="text-lg">Your cart is empty</p>
            <Link href="/" className="mt-3 inline-block text-blue-600 hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-zinc-700">RM {item.price.toFixed(2)}</p>
                  <p className="text-sm text-zinc-500">
                    Subtotal: RM {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center rounded-lg border border-zinc-300">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-3 py-2 font-bold hover:bg-zinc-100"
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      -
                    </button>
                    <span className="min-w-10 px-3 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-3 py-2 font-bold hover:bg-zinc-100"
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-col items-end gap-3 pt-4">
              <h2 className="text-xl font-bold">Total: RM {total.toFixed(2)}</h2>
              <Link
                href="/checkout"
                className="rounded-lg bg-black px-6 py-2 font-semibold text-white hover:bg-zinc-800"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
