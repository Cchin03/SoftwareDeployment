"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server"; // adjust to your server.ts path

// cart_items: id, user_id, variant_id, quantity, created_at
// product_variants: id, product_id, category_id, size, colour, pattern, stock_quantity
// products: id, category_id, name, brand, price, style, description, image, tag, rating, reviews

export type CartItem = {
  id: string;             
  variant_id: string;    
  quantity: number;      
  created_at: string;
  product_id: string;     
  category_id: string;    
  size: string | null;
  colour: string | null;
  pattern: string | null;
  stock_quantity: number; // so UI can warn if stock is low

  product_name: string;  
  brand: string;          
  price: number;          
  image: string | null;   
};

// Helper to get supabase client and authenticated user in one go, 
// since all cart actions require auth and we want to keep the code DRY.
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be logged in to manage your cart.");
  return { supabase, user };
}

// Fetch cart items for the authenticated user, including product and variant details for display in the cart UI.
export async function getCartItems(): Promise<CartItem[]> {
  const { supabase, user } = await getAuthUser();
  // We use a single query with joins to fetch cart items along with their product and variant details,
  // which is more efficient than multiple queries.
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      variant_id,
      quantity,
      created_at,
      product_variants (
        product_id,
        category_id,
        size,
        colour,
        pattern,
        stock_quantity,
        products (
          name,
          brand,
          price,
          image
          )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const variant = row.product_variants;
    const product = variant?.products;
    return {
      id: row.id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      created_at: row.created_at,
      product_id: variant?.product_id ?? "",
      category_id: variant?.category_id ?? "",
      product_name: product?.name ?? "Unknown product",
      brand: product?.brand ?? "",
      price: parseFloat((product?.price ?? "0").replace(/[^0-9.]/g, "")),
      image: product?.image ?? null,
      size: variant?.size ?? null,
      colour: variant?.colour ?? null,
      pattern: variant?.pattern ?? null,
      stock_quantity: variant?.stock_quantity ?? 0,
    };
  });
}

// Add to cart function checks stock and either adds a new item or updates quantity if the same variant already exists in cart. 
// It also includes optimistic UI updates for a snappier user experience. 
export async function addToCart(variantId: string, quantity = 1) {
  const { supabase, user } = await getAuthUser();

  // Check stock before adding
  const { data: variant } = await supabase
    .from("product_variants")
    .select("stock_quantity")
    .eq("id", variantId)
    .single();

  if (variant && variant.stock_quantity === 0) {
    throw new Error("This variant is out of stock.");
  }

  // If the same variant already exists in cart, increment quantity
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) {
    const newQty = existing.quantity + quantity;
    // Don't exceed available stock
    const safeQty = variant ? Math.min(newQty, variant.stock_quantity) : newQty;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: safeQty })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      variant_id: variantId,
      quantity,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/cart");
}

// Update cart item quantity, with the option to remove the item if quantity drops to 0. 
// Also includes stock checks and optimistic UI updates.
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const { supabase, user } = await getAuthUser();

  // If quantity drops to 0, remove instead
  if (quantity < 1) {
    return removeCartItem(cartItemId);
  }
  // Check stock before updating
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .eq("user_id", user.id); 

  if (error) throw new Error(error.message);
  revalidatePath("/cart");
}

// Remove a cart item by its id. This is used when the user clicks "Remove" or when quantity drops to 0 in the update function.
export async function removeCartItem(cartItemId: string) {
  const { supabase, user } = await getAuthUser();
  // Safety check to ensure users can only delete their own cart items.
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/cart");
}

// Clear the entire cart for the authenticated user. This is used when the user clicks "Clear Cart" or after a successful checkout.
export async function clearCart() {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/cart");
}