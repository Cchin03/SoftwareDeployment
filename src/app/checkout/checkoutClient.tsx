"use client";

// app/checkout/CheckoutClient.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkout } from "@/lib/checkoutActions";
import type { CartItemExpanded } from "@/lib//supabase/types";

// Country codes for phone number input with flags and validation rules
const COUNTRY_CODES = [
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "+63",  flag: "🇵🇭", name: "Philippines" },
  { code: "+84",  flag: "🇻🇳", name: "Vietnam" },
  { code: "+95",  flag: "🇲🇲", name: "Myanmar" },
  { code: "+855", flag: "🇰🇭", name: "Cambodia" },
  { code: "+856", flag: "🇱🇦", name: "Laos" },
  { code: "+673", flag: "🇧🇳", name: "Brunei" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1",   flag: "🇺🇸", name: "United States" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
];

// Validation and sanitization functions
function validatePhone(countryCode: string, number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "Phone number is required.";

  // Validation rules based on country code (adjust as needed)
  const rules: Record<string, { min: number; max: number }> = {
    "+60":  { min: 9,  max: 10 }, // Malaysia: 9–10 digits
    "+65":  { min: 8,  max: 8  }, // Singapore: 8
    "+62":  { min: 9,  max: 12 }, // Indonesia
    "+66":  { min: 9,  max: 9  }, // Thailand
    "+63":  { min: 10, max: 10 }, // Philippines
    "+84":  { min: 9,  max: 10 }, // Vietnam
    "+1":   { min: 10, max: 10 }, // US/Canada
    "+44":  { min: 10, max: 10 }, // UK
    "+91":  { min: 10, max: 10 }, // India
  };

  const rule = rules[countryCode];
  if (rule) {
    if (digits.length < rule.min || digits.length > rule.max) {
      return `Enter ${rule.min === rule.max ? rule.min : `${rule.min}–${rule.max}`} digits for ${countryCode}.`;
    }
  } else {
    if (digits.length < 7 || digits.length > 15) {
      return "Enter a valid phone number (7–15 digits).";
    }
  }
  return null;
}

// Sanitize text input by allowing only certain characters to prevent XSS and formatting issues
function sanitizeText(value: string): string {
  // Allow: letters (incl. Unicode for Malay/Chinese), digits, spaces, hyphen, apostrophe, comma, period, slash
  // NOT allowed: @, #, $, %, ^, &, *, !, ?, etc.
  return value.replace(/[^a-zA-Z0-9\u00C0-\u024F\u4E00-\u9FFF\s\-'.,/]/g, "");
}

// Sanitize phone number for display by stripping non-digit characters (for consistent formatting and validation)
function sanitizePhoneDisplay(value: string): string {
  return value.replace(/[^0-9]/g, ""); // digits only, no hyphens or spaces
}

// Block special characters on keydown before they reach the input value
function blockSpecialKey(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (e.key.length > 1) return; // allow control keys, arrows, backspace, etc.
  const allowed = /^[a-zA-Z0-9\u00C0-\u024F\u4E00-\u9FFF\s\-'.,\/]$/;
  if (!allowed.test(e.key)) e.preventDefault();
}

// Block non-numeric/phone keys on keydown 
function blockNonPhone(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key.length > 1) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault(); // digits only
}

type Props = {
  items: CartItemExpanded[];
  userEmail: string;
  defaultName: string;
};

// Main checkout component
export default function CheckoutClient({ items, userEmail, defaultName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  const [form, setForm] = useState({
    recipientName: defaultName,
    senderName: defaultName,
    whatsappCountry: "+60", 
    whatsapp: "",
    address: "",
    city: "",
    paymentMethod: "cash" as "cash" | "online_banking",
  });

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear field error on change
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleTextChange(field: keyof typeof form, value: string) {
    update(field, sanitizeText(value));
  }

  function handlePhoneChange(field: "whatsapp", value: string) {
    update(field, sanitizePhoneDisplay(value));
  }
  // Validation function checks all fields and sets fieldErrors state. 
  // Returns true if valid, false if there are errors.
  function validate(): boolean {
    const errors: Partial<Record<string, string>> = {};
    if (!form.recipientName.trim()) errors.recipientName = "Recipient name is required.";
    if (!form.senderName.trim()) errors.senderName = "Sender name is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.address.trim()) errors.address = "Address is required.";

    const waError = validatePhone(form.whatsappCountry, form.whatsapp);
    if (waError) errors.whatsapp = waError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }
  // Handle form submission: validate, then call checkout action. 
  // Show any errors returned from the checkout process.
  function handleSubmit() {
    setError("");
    if (!validate()) 
      return;
    startTransition(async () => {
      try {
        await checkout({
          recipientName: form.recipientName,
          senderName: form.senderName,
          whatsapp: `${form.whatsappCountry}${form.whatsapp.replace(/\D/g, "")}`,
          address: form.address,
          city: form.city,
          paymentMethod: form.paymentMethod,
        });
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            shop<span className="text-indigo-500">.</span>io
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/cart" className="hover:text-zinc-900 transition-colors">Cart</Link>
            <span>/</span>
            <span className="font-semibold text-zinc-900">Checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Back button */}
        <button
          onClick={() => router.push("/cart")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cart
        </button>

        <h1 className="text-3xl font-extrabold text-zinc-900 mb-1">Checkout</h1>
        <p className="text-zinc-500 text-sm mb-8">Fill in your details to complete your order</p>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Form*/}
          <div className="flex-1 space-y-6">

            {/* Delivery details */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Delivery Details
              </h2>
              <div className="space-y-4">

                <Field label="Recipient Name *" error={fieldErrors.recipientName}>
                  <input
                    type="text"
                    placeholder="Name of person receiving the order"
                    value={form.recipientName}
                    onChange={(e) => handleTextChange("recipientName", e.target.value)}
                    onKeyDown={blockSpecialKey}
                    onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text"); update("recipientName", sanitizeText(form.recipientName + text)); }}
                    className={inputCls(!!fieldErrors.recipientName)}
                  />
                </Field>

                <Field label="Sender / Billing Name *" error={fieldErrors.senderName}>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.senderName}
                    onChange={(e) => handleTextChange("senderName", e.target.value)}
                    onKeyDown={blockSpecialKey}
                    onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text"); update("senderName", sanitizeText(form.senderName + text)); }}
                    className={inputCls(!!fieldErrors.senderName)}
                  />
                </Field>

                <Field label="WhatsApp Number *" error={fieldErrors.whatsapp}>
                  <PhoneInput
                    countryCode={form.whatsappCountry}
                    number={form.whatsapp}
                    onCountryChange={(c) => update("whatsappCountry", c)}
                    onNumberChange={(v) => handlePhoneChange("whatsapp", v)}
                    hasError={!!fieldErrors.whatsapp}
                    icon=""
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Number will be sent as <span className="font-medium">{form.whatsappCountry}{form.whatsapp.replace(/\D/g, "") || "XXXXXXXXXX"}</span>
                  </p>
                </Field>

                <Field label="City *" error={fieldErrors.city}>
                  <input
                    type="text"
                    placeholder="e.g. Kuala Lumpur"
                    value={form.city}
                    onChange={(e) => handleTextChange("city", e.target.value)}
                    onKeyDown={blockSpecialKey}
                    onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text"); update("city", sanitizeText(form.city + text)); }}
                    className={inputCls(!!fieldErrors.city)}
                  />
                </Field>

                <Field label="Full Address *" error={fieldErrors.address}>
                  <textarea
                    placeholder="Street address, unit number, postcode"
                    value={form.address}
                    onChange={(e) => handleTextChange("address", e.target.value)}
                    onKeyDown={blockSpecialKey}
                    onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text"); update("address", sanitizeText(form.address + text)); }}
                    rows={3}
                    className={`${inputCls(!!fieldErrors.address)} resize-none`}
                  />
                </Field>

              </div>
            </div>

            {/* Payment method: no payment gateway */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: "cash", label: "Cash on Delivery", icon: "💵", desc: "Pay when your order arrives" },
                  { value: "online_banking", label: "Online Banking",   icon: "🏦", desc: "Transfer via FPX / DuitNow" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("paymentMethod", opt.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      form.paymentMethod === opt.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.paymentMethod === opt.value ? "text-indigo-700" : "text-zinc-900"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {form.paymentMethod === opt.value && (
                      <span className="ml-auto text-indigo-600 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {form.paymentMethod === "online_banking" && (
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                  <p className="font-semibold mb-1">Bank Transfer Details</p>
                  <p>Bank: Maybank</p>
                  <p>Account: 1234 5678 9012</p>
                  <p>Name: Shop.io Sdn Bhd</p>
                  <p className="mt-2 text-xs text-blue-500">Please transfer within 24 hours of placing your order.</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <aside className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-24">
              <h2 className="text-base font-bold text-zinc-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🛍️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-zinc-400">
                        {[item.size, item.colour, item.pattern].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">× {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 shrink-0">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal ({totalQty} items)</span>
                  <span>RM {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 text-base pt-2 border-t border-zinc-100">
                  <span>Total</span>
                  <span>RM {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="mt-6 w-full bg-indigo-600 text-white py-3.5 rounded-full font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Placing Order…
                  </>
                ) : "Place Order →"}
              </button>

              <p className="text-xs text-zinc-400 text-center mt-3">
                By placing your order you agree to our terms of service.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Phone Input 
function PhoneInput({
  countryCode,
  number,
  onCountryChange,
  onNumberChange,
  hasError,
  icon,
}: {
  countryCode: string;
  number: string;
  onCountryChange: (c: string) => void;
  onNumberChange: (v: string) => void;
  hasError?: boolean;
  icon?: string;
}) {
  const selected = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <div className={`flex rounded-xl border overflow-hidden transition ${hasError ? "border-red-400 ring-2 ring-red-200" : "border-zinc-200 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-transparent"}`}>
      {/* Country selector */}
      <div className="relative shrink-0">
        <select
          value={countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className="appearance-none h-full pl-3 pr-7 py-2.5 bg-zinc-50 border-r border-zinc-200 text-sm text-zinc-700 focus:outline-none cursor-pointer"
          style={{ minWidth: "5.5rem" }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Number input */}
      <div className="relative flex-1">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">{icon}</span>
        )}
        <input
          type="tel"
          placeholder="e.g. 123456789"
          value={number}
          onChange={(e) => onNumberChange(e.target.value)}
          onKeyDown={blockNonPhone}
          className={`w-full py-2.5 pr-4 text-sm text-zinc-900 bg-white focus:outline-none ${icon ? "pl-9" : "pl-4"}`}
        />
      </div>
    </div>
  );
}

// Reusable field component that shows label, input, and error message.
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Utility function to generate input class names based on error state
const inputCls = (hasError: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm text-zinc-900 focus:outline-none focus:ring-2 transition ${
    hasError
      ? "border-red-400 ring-2 ring-red-200 focus:ring-red-300"
      : "border-zinc-200 focus:ring-indigo-300 focus:border-transparent"
  }`;
