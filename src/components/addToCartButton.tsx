"use client";

// components/AddToCartButton.tsx
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { addToCart } from "@/lib/cartActions";
import type { ProductVariant } from "@/lib/supabase/types";

type Props = {
  productPrice: string | number;
  matchedVariant: ProductVariant | null;
};

// This component renders the "Add to Cart" button on the product page, along with a quantity selector and feedback messages. It handles adding the selected variant and quantity to the cart, and provides user feedback for different scenarios (success, error, out of stock, authentication required). If the user is not authenticated, it prompts them to sign in or register, and redirects back to the current product page after login/registration.
export function AddToCartButton({ productPrice, matchedVariant }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<"idle" | "success" | "error" | "auth" | "stock">("idle");

  const price = parseFloat(String(productPrice).replace(/[^0-9.]/g, ""));
  const outOfStock = matchedVariant ? matchedVariant.stock_quantity === 0 : false;
  const maxQty = matchedVariant?.stock_quantity ?? 1;
  const isLowStock = matchedVariant && matchedVariant.stock_quantity > 0 && matchedVariant.stock_quantity <= 3;
  const noMatch = matchedVariant === null;

  // Handle adding the item to cart. If not authenticated, set feedback to "auth" to show the auth prompt. If out of stock, set feedback to "stock". If successful, set feedback to "success". If there's an error, set feedback to "error". In all cases except auth, reset feedback to "idle" after 2.5 seconds.
  function handleAddToCart() {
    if (!matchedVariant || outOfStock) return;

    // Use startTransition to avoid blocking the UI while we wait for the addToCart action to complete. This allows us to show immediate feedback (e.g. disable button, show loading state) without waiting for the async operation to finish. The addToCart function will return an object indicating success or the reason for failure, which we use to set the appropriate feedback state.
    startTransition(async () => {
      const result = await addToCart(matchedVariant.id, quantity);

      if (result.reason === "auth") {
        setFeedback("auth");
      } else if (result.reason === "stock") {
        setFeedback("stock");
        setTimeout(() => setFeedback("idle"), 2500);
      } else if (result.success) {
        setFeedback("success");
        setQuantity(1);
        setTimeout(() => setFeedback("idle"), 2500);
      } else {
        setFeedback("error");
        setTimeout(() => setFeedback("idle"), 2500);
      }
    });
  }

  return (
    <div className="mt-6 space-y-4">

      {/* Stock status messages */}
      {noMatch && (
        <p className="text-sm text-zinc-400 italic">No variant found for this combination.</p>
      )}
      {!noMatch && outOfStock && (
        <p className="text-sm font-medium text-red-500">This combination is out of stock.</p>
      )}
      {isLowStock && (
        <p className="text-sm font-medium text-amber-500">
          Only {matchedVariant.stock_quantity} left in stock!
        </p>
      )}

      {/* Quantity stepper */}
      {!noMatch && !outOfStock && (
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Qty</p>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-zinc-600 transition-colors hover:bg-zinc-100"
            >−</button>
            <span className="w-6 text-center text-sm font-semibold text-zinc-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
            >+</button>
          </div>
          {!isNaN(price) && (
            <p className="ml-auto text-sm font-semibold text-zinc-700">
              RM {(price * quantity).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Add to cart button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending || outOfStock || noMatch}
        className={`w-full rounded-full py-3.5 text-sm font-semibold transition-all disabled:opacity-50 ${
          feedback === "success"
            ? "bg-green-600 text-white"
            : feedback === "error" || feedback === "stock"
            ? "bg-red-600 text-white"
            : "bg-zinc-900 text-white hover:bg-zinc-700"
        }`}
      >
        {isPending
          ? "Adding…"
          : feedback === "success"
          ? "✓ Added to cart!"
          : feedback === "error"
          ? "Something went wrong"
          : feedback === "stock"
          ? "Out of stock"
          : outOfStock || noMatch
          ? "Out of Stock"
          : "Add to Cart"}
      </button>

      {/* Auth prompt — redirects back to THIS product page after login */}
      {feedback === "auth" && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
          <p className="text-sm font-medium text-zinc-800 mb-3">
            Sign in to add items to your cart
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
              className="flex-1 bg-zinc-900 text-white text-sm font-semibold py-2.5 rounded-full hover:bg-zinc-700 transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push(`/register?next=${encodeURIComponent(pathname)}`)}
              className="flex-1 border border-zinc-200 text-zinc-700 text-sm font-semibold py-2.5 rounded-full hover:bg-zinc-100 transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
