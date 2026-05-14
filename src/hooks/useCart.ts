"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import {
  CartItem,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "@/lib/cartActions";

// Action types for cart reducer
type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "UPDATE"; id: string; quantity: number }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

// Reducer function to manage cart state based on actions
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    // For ADD, we check if the item already exists in the cart (by variant_id).
    // If it does, we update the quantity. Otherwise, we add it as a new item.
    case "ADD": {
      const existing = state.find((i) => i.variant_id === action.item.variant_id);
      if (existing) {
        return state.map((i) =>
          i.variant_id === action.item.variant_id
            ? { ...i, quantity: i.quantity + action.item.quantity }
            : i
        );
      }
      return [...state, action.item];
    }
    // For UPDATE, if the new quantity is less than 1, we remove the item. Otherwise, we update its quantity.
    case "UPDATE":
      if (action.quantity < 1) return state.filter((i) => i.id !== action.id);
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: action.quantity } : i
      );
      // For REMOVE, we simply filter out the item with the given id.
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
      // For CLEAR, we return an empty array, effectively clearing the cart.
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// Custom hook to manage cart state with optimistic updates
export function useCart(initialItems: CartItem[]) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, dispatch] = useOptimistic(initialItems, cartReducer);

  const totalItems = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = optimisticItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // handleAdd is used to add a new item to the cart. It dispatches an ADD action with an optimistic 
  // item (which has a temporary id and current timestamp) and then calls the addToCart API function.
  const handleAdd = useCallback(
    (variantId: string, item: Omit<CartItem, "id" | "created_at">, quantity = 1) => {
      startTransition(async () => {
        dispatch({
          type: "ADD",
          item: {
            ...item,
            id: `optimistic-${Date.now()}`,
            created_at: new Date().toISOString(),
            quantity,
          },
        });
        await addToCart(variantId, quantity);
      });
    },
    []
  );

  // handleUpdateQuantity is used to update the quantity of an existing cart item. It dispatches an UPDATE action with the new quantity and then calls the updateCartItemQuantity API function.
  const handleUpdateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      startTransition(async () => {
        dispatch({ type: "UPDATE", id: cartItemId, quantity });
        await updateCartItemQuantity(cartItemId, quantity);
      });
    },
    []
  );

  // handleRemove is used to remove an item from the cart. It dispatches a REMOVE action with the item's id and then calls the removeCartItem API function.
  const handleRemove = useCallback((cartItemId: string) => {
    startTransition(async () => {
      dispatch({ type: "REMOVE", id: cartItemId });
      await removeCartItem(cartItemId);
    });
  }, []);

  // handleClear is used to clear all items from the cart. It dispatches a CLEAR action and then calls the clearCart API function.
  const handleClear = useCallback(() => {
    startTransition(async () => {
      dispatch({ type: "CLEAR" });
      await clearCart();
    });
  }, []);

  return {
    items: optimisticItems,
    totalItems,
    totalPrice,
    isPending,
    handleAdd,
    handleUpdateQuantity,
    handleRemove,
    handleClear,
  };
}
