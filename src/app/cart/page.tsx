import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; 
import { getCartItems } from "@/lib/cartActions";
import { CartClient } from "./cartClient";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user) {
    redirect("/login?next=/cart");
  }

  const items = await getCartItems();
  // Pass the last-visited category id for better back button UX.
  //  Here we just read from the first cart item, but you can also read from a cookie/localStorage if you set it on category page visits.
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-zinc-900"
          >
            shop<span className="text-indigo-500">.</span>io
          </Link>
          <span className="text-sm text-zinc-500">
            Signed in as{" "}
            <span className="font-medium text-zinc-700">{user.email}</span>
          </span>
        </div>
      </header>

      <CartClient initialItems={items} />
    </div>
  );
}
