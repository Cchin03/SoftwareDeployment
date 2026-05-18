"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number | string;
  categoryId?: number | string;
  variantId?: number | string;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutForm = {
  name: string;
  email: string;
  city: string;
  address: string;
};

const initialForm: CheckoutForm = {
  name: "",
  email: "",
  city: "",
  address: "",
};

const getCartSnapshot = () =>
  typeof window === "undefined" ? "[]" : localStorage.getItem("cart") || "[]";

const subscribeToCart = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("cart-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cart-updated", callback);
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

export default function CheckoutPage() {
  const router = useRouter();

  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [error, setError] = useState("");
  const cartSnapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => "[]");
  const cartItems = useMemo(() => parseCart(cartSnapshot), [cartSnapshot]);

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const updateForm = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
    };

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!trimmedForm.name || !trimmedForm.email || !trimmedForm.city || !trimmedForm.address) {
      setError("Please fill in all checkout details.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedForm.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("checkoutDetails", JSON.stringify(trimmedForm));
    router.push("/confirm-order");
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-black sm:p-8">
      <form
        onSubmit={handleConfirm}
        className="mx-auto max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <Link href="/cart" className="text-sm font-semibold text-blue-600 hover:underline">
            Back to cart
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-lg border border-zinc-300 p-3 text-black placeholder:text-zinc-500"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
          />

          <input
            className="w-full rounded-lg border border-zinc-300 p-3 text-black placeholder:text-zinc-500"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
          />

          <input
            className="w-full rounded-lg border border-zinc-300 p-3 text-black placeholder:text-zinc-500 sm:col-span-2"
            placeholder="City"
            value={form.city}
            onChange={(event) => updateForm("city", event.target.value)}
          />

          <textarea
            className="min-h-28 w-full rounded-lg border border-zinc-300 p-3 text-black placeholder:text-zinc-500 sm:col-span-2"
            placeholder="Delivery address"
            value={form.address}
            onChange={(event) => updateForm("address", event.target.value)}
          />
        </div>

        <h2 className="mb-3 mt-8 text-xl font-bold">Order Summary</h2>

        {cartItems.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 p-4 text-zinc-700">
            Your cart is empty.
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-zinc-700">
                    RM {item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  RM {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-xl font-bold">Total: RM {total.toFixed(2)}</div>

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cartItems.length === 0}
          className="mt-6 w-full rounded-lg bg-black py-3 font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          Confirm Order
        </button>
      </form>
    </main>
  );
}
