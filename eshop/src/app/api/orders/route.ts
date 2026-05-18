import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CartItem = {
  id?: number | string;
  categoryId?: number | string;
  variantId?: number | string;
  name?: string;
  price?: number;
  quantity?: number;
};

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 401 });
    }
  }

  let body: {
    name?: string;
    email?: string;
    city?: string;
    address?: string;
    cartItems?: CartItem[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid order request" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const city = body.city?.trim();
  const address = body.address?.trim();
  const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];

  if (!name || !email || !city || !address || cartItems.length === 0) {
    return NextResponse.json(
      { error: "Missing checkout details or cart items" },
      { status: 400 }
    );
  }

  const normalizedItems = cartItems.map((item) => ({
    name: item.name?.trim() ?? "",
    price: Number(item.price),
    quantity: Number(item.quantity),
  }));

  const hasInvalidItem = normalizedItems.some(
    (item) =>
      !item.name ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
  );

  if (hasInvalidItem) {
    return NextResponse.json({ error: "Invalid cart item details" }, { status: 400 });
  }

  const total = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const orderId = crypto.randomUUID();

  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      customer: name,
      city,
      address,
      total,
      items: normalizedItems.length,
      date: new Date().toISOString(),
      status: "Pending",
    });

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, orderId, total });
}
