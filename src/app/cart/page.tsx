import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; 
import { getCartItems } from "@/lib/cartActions";
import { CartClient } from "./cartClient";
import Navbar from "@/components/navbar";

export default async function CartPage() {
  // This is a server component that fetches the cart items and user session.
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  const isGuest = !supabaseUser;
  

  // Redirect unauthenticated users to login
  if (isGuest) {
    redirect("/login?next=/cart");
  }

  const navbarUser = supabaseUser
    ? {
        name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split('@')[0] ?? "User",
        email: supabaseUser.email ?? '',
      }
    : null;

  const items = await getCartItems();
  // Pass the last-visited category id for better back button UX.
  //  Here we just read from the first cart item, but you can also read from a cookie/localStorage if you set it on category page visits.
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <Navbar user={navbarUser} showCart={false} showNavLinks={false}/>

      <CartClient initialItems={items} />
    </div>
  );
}