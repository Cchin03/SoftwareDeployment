// app/order/[orderId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "./printButton";

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  const paymentLabel = order.payment_method === "online_banking" ? "Online Banking" : "Cash on Delivery";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            shop<span className="text-indigo-500">.</span>io
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Success banner */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 mb-1">Order Confirmed!</h1>
          <p className="text-zinc-500 text-sm">
            Your order has been placed.
          </p>
        </div>

        {/* Receipt card */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden mt-6">

          <div className="bg-zinc-900 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Order ID</p>
              <p className="text-white font-bold text-lg">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Date</p>
              <p className="text-white text-sm font-medium">{order.date}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Status */}
            <div className="flex items-center justify-between py-3 px-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-sm font-medium text-amber-700">Order Status</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                {order.status}
              </span>
            </div>

            {/* Delivery info */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Delivery Information</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Recipient" value={order.customer} />
                <InfoRow label="Sender" value={order.sender_name ?? "—"} />
                <InfoRow label="Phone" value={order.phone ?? "—"} />
                <InfoRow label="WhatsApp" value={order.whatsapp ?? "—"} />
                <InfoRow label="City" value={order.city} />
                <div className="col-span-2">
                  <InfoRow label="Address" value={order.address} />
                </div>
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Items Ordered</p>
              <div className="space-y-3">
                {(items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-zinc-400">
                        {item.size} · {item.colour} · × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-zinc-900 ml-4 shrink-0">
                      RM {(Number(item.price_at_purchase) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Total and payment */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Payment Method</p>
                <p className="text-sm font-medium text-zinc-700">{paymentLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 mb-0.5">Total Amount</p>
                <p className="text-2xl font-extrabold text-zinc-900">
                  RM {Number(order.total).toFixed(2)}
                </p>
              </div>
            </div>

          </div>

          <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 text-center">
            <p className="text-xs text-zinc-400">
              Questions? Contact us at{" "}
              <a href="mailto:support@shop.io" className="text-indigo-600 hover:underline">
                support@shop.io
              </a>
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-zinc-900 text-white py-3 rounded-full font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <PrintButton />
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-800">{value}</p>
    </div>
  );
}
