// app/checkout/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cartActions";
import CheckoutClient from "./checkoutClient";

// This is a server component that checks authentication, fetches cart items and user profile, and then renders the CheckoutClient with the necessary data.
export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login with next param to return here after login. You could also choose to allow guest checkout and just collect email/name upfront without requiring login.
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
