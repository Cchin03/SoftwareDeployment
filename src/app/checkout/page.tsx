// app/checkout/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cartActions";
import CheckoutClient from "./checkoutClient";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/checkout");

  const items = await getCartItems();
  if (items.length === 0) redirect("/cart");

  // Pre-fill name from profile if available
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <CheckoutClient
      items={items}
      userEmail={user.email ?? ""}
      defaultName={profile?.name ?? ""}
    />
  );
}
