"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type OrderStatus = "loading" | "success" | "error";

type CartItem = {
  id: number | string;
  categoryId?: number | string;
  variantId?: number | string;
  name: string;
  price: number;
  quantity: number;
};

export default function ConfirmOrderPage() {
  const [status, setStatus] = useState<OrderStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    const checkout = JSON.parse(localStorage.getItem("checkoutDetails") || "{}");
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

    if (!checkout.name || !checkout.email || !checkout.city || !checkout.address || cart.length === 0) {
      setErrorMessage("Checkout details or cart items are missing.");
      setStatus("error");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    let isActive = true;

    const submitOrder = async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: checkout.name,
            email: checkout.email,
            city: checkout.city,
            address: checkout.address,
            cartItems: cart,
          }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to place order.");
        }

        setStatus("success");
        localStorage.removeItem("cart");
        localStorage.removeItem("checkoutDetails");
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === "AbortError"
            ? "Order request timed out. Please check your database connection and try again."
            : error instanceof Error
              ? error.message
              : "Unable to place order.";

        if (isActive) {
          setErrorMessage(message);
          setStatus("error");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    submitOrder();

    return () => {
      isActive = false;
      submitted.current = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-black">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        {status === "loading" && (
          <p className="text-lg font-semibold text-zinc-700">Processing your order...</p>
        )}

        {status === "success" && (
          <div>
            <p className="mb-4 text-xl font-bold text-green-600">
              Order placed successfully.
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-black px-5 py-2 font-semibold text-white hover:bg-zinc-800"
            >
              Back to Home
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <p className="mb-3 text-xl font-bold text-red-500">Something went wrong.</p>
            <p className="mb-5 text-sm text-zinc-600">{errorMessage}</p>
            <Link
              href="/checkout"
              className="inline-block rounded-lg bg-black px-5 py-2 font-semibold text-white hover:bg-zinc-800"
            >
              Back to Checkout
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
