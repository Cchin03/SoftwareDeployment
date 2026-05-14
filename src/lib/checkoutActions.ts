"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CheckoutFormData = {
  recipientName: string;
  senderName: string;
  whatsapp: string;
  address: string;
  city: string;
  paymentMethod: "cash" | "online_banking";
};
 
function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}
 
export async function checkout(formData: CheckoutFormData) {
  const supabase = await createClient();
 
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to checkout.");
 
  // Fetch cart with product details
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      variant_id,
      product_variants (
        id,
        size,
        colour,
        pattern,
        stock_quantity,
        product_id,
        category_id,
        products ( name, price )
      )
    `)
    .eq("user_id", user.id);
 
  if (cartError) throw new Error(cartError.message);
  if (!cartRows || cartRows.length === 0) throw new Error("Your cart is empty.");
 
  // Validate stock
  for (const row of cartRows) {
    const variant = row.product_variants as any;
    if (!variant) throw new Error("Invalid cart item.");
    if (variant.stock_quantity < row.quantity) {
      throw new Error(`"${variant.products?.name}" only has ${variant.stock_quantity} units left.`);
    }
  }
 
  // Build order items
  const orderItems = cartRows.map((row) => {
    const variant = row.product_variants as any;
    const price = parseFloat((variant.products?.price ?? "0").replace(/[^0-9.]/g, ""));
    return {
      variant_id: row.variant_id,
      product_id: variant.product_id,
      category_id: variant.category_id,
      product_name: variant.products?.name ?? "Unknown",
      size: variant.size,
      colour: variant.colour,
      quantity: row.quantity,
      price_at_purchase: price,
      subtotal: price * row.quantity,
    };
  });
 
  const total = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
  const totalQty = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const orderId = generateOrderId();
  const today = new Date().toLocaleDateString("en-MY", {
    year: "numeric", month: "long", day: "numeric",
  });
 
  // Insert into orders table
  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    customer: formData.recipientName,
    city: formData.city,
    items: totalQty,
    total,
    date: today,
    status: "Pending",
    address: formData.address,
    whatsapp: formData.whatsapp,
    sender_name: formData.senderName,
    payment_method: formData.paymentMethod,
  });
  if (orderError) throw new Error(orderError.message);
 
  // Insert order_items
  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      category_id: i.category_id,
      variant_id: i.variant_id,
      product_name: i.product_name,
      size: i.size,
      colour: i.colour,
      quantity: i.quantity,
      price_at_purchase: i.price_at_purchase,
    }))
  );
  if (itemsError) throw new Error(itemsError.message);
 
  // Decrement stock
  for (const row of cartRows) {
    const variant = row.product_variants as any;
    await supabase
      .from("product_variants")
      .update({ stock_quantity: variant.stock_quantity - row.quantity })
      .eq("id", row.variant_id);
  }
 
  // Clear cart
  await supabase.from("cart_items").delete().eq("user_id", user.id);
 
  revalidatePath("/cart");
  redirect(`/order/${orderId}`);
}