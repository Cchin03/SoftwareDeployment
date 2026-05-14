"use client";
// This component uses window.print() which is client-only, so we put it in a separate file and import dynamically in the parent to avoid hydration mismatch.
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 text-center border border-zinc-200 text-zinc-700 py-3 rounded-full font-semibold text-sm hover:bg-zinc-50 transition-colors"
    >
      Print Receipt
    </button>
  );
}