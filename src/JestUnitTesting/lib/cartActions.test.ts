import {
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "@/lib/cartActions";

// Mocks for Supabase client and next/cache revalidation
const mockRevalidatePath = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// We build a chainable Supabase query builder mock
function makeQueryBuilder(overrides: Record<string, jest.Mock> = {}) {
  const builder: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // Allow chaining — every method returns the builder unless overridden
  Object.keys(builder).forEach((key) => {
    if (!["single", "maybeSingle"].includes(key)) {
      const original = builder[key];
      builder[key] = jest.fn((...args) => {
        original(...args);
        return builder;
      });
    }
  });
  return builder;
}

// Track the latest builder so tests can assert on it
let mockBuilder = makeQueryBuilder();

const mockGetUser = jest.fn();
const mockFrom = jest.fn(() => mockBuilder);

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

// Helper function to set up the auth mock for a given user state (authenticated or not) to be used in tests that require simulating different authentication scenarios without having to repeat the mock setup logic in each test case. This keeps the tests concise and focused on the relevant behavior being tested while still providing a consistent way to control the authentication state across multiple tests.
const AUTHED_USER = { id: "user-123", email: "test@example.com" };

const RAW_CART_ROW = {
  id: "cart-item-1",
  variant_id: "variant-1",
  quantity: 2,
  created_at: "2024-01-01T00:00:00Z",
  product_variants: {
    product_id: "product-1",
    category_id: "category-electronics",
    size: "M",
    colour: "Black",
    pattern: "Solid",
    stock_quantity: 10,
    products: {
      name: "Test Product",
      brand: "TestBrand",
      price: "RM 99.00",
      image: "/img/test.jpg",
    },
  },
};


function mockAuth(user: typeof AUTHED_USER | null = AUTHED_USER) {
  mockGetUser.mockResolvedValue({ data: { user }, error: user ? null : new Error("No user") });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBuilder = makeQueryBuilder();
  mockFrom.mockReturnValue(mockBuilder);
});

// Test getCartItems function in cartActions, which handles fetching the authenticated user's cart items and mapping them to a more usable format.
// We mock the necessary dependencies (e.g. supabase auth, supabase from method, next/cache) to isolate the behavior of the addToCart function and assert that it correctly checks for user authentication, verifies stock availability, inserts or updates cart items as needed, and revalidates the cart page. 
// We also test edge cases such as when the user is not authenticated, when the variant is out of stock, and when the Supabase insert/update operations return errors to ensure that the function behaves correctly in those scenarios as well.
describe("getCartItems", () => {
  it("throws when user is not authenticated", async () => {
    mockAuth(null);
    await expect(getCartItems()).rejects.toThrow(/logged in/i);
  });

  it("returns an empty array when cart is empty", async () => {
    mockAuth();
    // Make the final awaited call resolve with empty data
    mockBuilder.order = jest.fn().mockResolvedValue({ data: [], error: null });
    const items = await getCartItems();
    expect(items).toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    mockAuth();
    mockBuilder.order = jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    await expect(getCartItems()).rejects.toThrow("DB error");
  });

  it("maps raw rows to CartItem shape correctly", async () => {
    mockAuth();
    mockBuilder.order = jest.fn().mockResolvedValue({ data: [RAW_CART_ROW], error: null });
    const [item] = await getCartItems();
    expect(item.id).toBe("cart-item-1");
    expect(item.variant_id).toBe("variant-1");
    expect(item.quantity).toBe(2);
    expect(item.product_name).toBe("Test Product");
    expect(item.brand).toBe("TestBrand");
    expect(item.price).toBe(99);
    expect(item.image).toBe("/img/test.jpg");
    expect(item.size).toBe("M");
    expect(item.colour).toBe("Black");
    expect(item.pattern).toBe("Solid");
    expect(item.stock_quantity).toBe(10);
  });

  it("handles missing product variant gracefully with fallback values", async () => {
    mockAuth();
    const rowWithNullVariant = { ...RAW_CART_ROW, product_variants: null };
    mockBuilder.order = jest.fn().mockResolvedValue({ data: [rowWithNullVariant], error: null });
    const [item] = await getCartItems();
    expect(item.product_name).toBe("Unknown product");
    expect(item.price).toBe(0);
    expect(item.image).toBeNull();
  });

  it("queries cart_items ordered by created_at ascending", async () => {
    mockAuth();
    mockBuilder.order = jest.fn().mockResolvedValue({ data: [], error: null });
    await getCartItems();
    expect(mockBuilder.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});


// Test add to cart function in cartActions, which handles adding a product variant to the authenticated user's cart and revalidating the cart page. 
describe("addToCart", () => {
  it("returns { success: false, reason: 'auth' } when user is not logged in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await addToCart("variant-1", 1);
    expect(result).toEqual({ success: false, reason: "auth" });
  });

  it("returns { success: false, reason: 'stock' } when variant stock is 0", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });
    mockBuilder.single = jest.fn().mockResolvedValue({
      data: { stock_quantity: 0 },
      error: null,
    });
    const result = await addToCart("variant-1", 1);
    expect(result).toEqual({ success: false, reason: "stock" });
  });

  it("inserts a new cart item when variant is not already in cart", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });

    let callCount = 0;
    mockFrom.mockImplementation((): Record<string, jest.Mock> => {
      callCount++;
      if (callCount === 1) {
        // product_variants stock check
        return {
          ...mockBuilder,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { stock_quantity: 10 }, error: null }),
        };
      }
      if (callCount === 2) {
        // cart_items existing check
        return {
          ...mockBuilder,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      // insert
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    const result = await addToCart("variant-1", 1);
    expect(result).toEqual({ success: true });
  });

  it("updates quantity when variant already exists in cart", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });

    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq     = jest.fn().mockResolvedValue({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((): Record<string, jest.Mock> => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { stock_quantity: 10 }, error: null }),
        };
      }
      if (callCount === 2) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "cart-item-1", quantity: 2 },
            error: null,
          }),
        };
      }
      // update
      return { update: mockUpdate, eq: mockEq };
    });

    const result = await addToCart("variant-1", 1);
    expect(result).toEqual({ success: true });
  });

  it("caps updated quantity at max stock", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });

    const capturedUpdate: { quantity?: number } = {};
    let callCount = 0;

    mockFrom.mockImplementation((): Record<string, jest.Mock> => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { stock_quantity: 3 }, error: null }),
        };
      }
      if (callCount === 2) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "cart-item-1", quantity: 2 },
            error: null,
          }),
        };
      }
      return {
        update: jest.fn((data) => { capturedUpdate.quantity = data.quantity; return { eq: jest.fn().mockResolvedValue({ error: null }) }; }),
      };
    });

    await addToCart("variant-1", 5); // wants 2+5=7 but stock is 3
    expect(capturedUpdate.quantity).toBe(3);
  });

  it("returns { success: false, reason: 'error' } when insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });

    let callCount = 0;
    mockFrom.mockImplementation((): Record<string, jest.Mock> => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { stock_quantity: 10 }, error: null }),
        };
      }
      if (callCount === 2) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return { insert: jest.fn().mockResolvedValue({ error: { message: "Insert failed" } }) };
    });

    const result = await addToCart("variant-1", 1);
    expect(result).toEqual({ success: false, reason: "error" });
  });

  it("revalidates /cart on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER } });

    let callCount = 0;
    mockFrom.mockImplementation((): Record<string, jest.Mock> => {
      callCount++;
      if (callCount === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { stock_quantity: 10 }, error: null }) };
      if (callCount === 2) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    await addToCart("variant-1", 1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cart");
  });
});

// Test update cart quantity function in cartActions, which handles updating the quantity of a specific cart item for the authenticated user and revalidating the cart page.
describe("updateCartItemQuantity", () => {
  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No user") });
    await expect(updateCartItemQuantity("item-1", 2)).rejects.toThrow(/logged in/i);
  });

  it("updates the quantity when quantity >= 1", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await updateCartItemQuantity("item-1", 3);
    expect(mockUpdate).toHaveBeenCalledWith({ quantity: 3 });
  });

  it("calls removeCartItem (delete) when quantity is 0", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await updateCartItemQuantity("item-1", 0);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("calls removeCartItem when quantity is negative", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await updateCartItemQuantity("item-1", -1);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("revalidates /cart on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: mockEq1 }) });

    await updateCartItemQuantity("item-1", 2);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("throws when Supabase update returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: { message: "Update failed" } });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: mockEq1 }) });

    await expect(updateCartItemQuantity("item-1", 2)).rejects.toThrow("Update failed");
  });
});

// Test remove cart items functions in cartActions, which handle deleting cart items for the authenticated user and revalidating the cart page. 
describe("removeCartItem", () => {
  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No user") });
    await expect(removeCartItem("item-1")).rejects.toThrow(/logged in/i);
  });

  it("deletes the cart item by id and user_id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await removeCartItem("item-1");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq1).toHaveBeenCalledWith("id", "item-1");
    expect(mockEq2).toHaveBeenCalledWith("user_id", AUTHED_USER.id);
  });

  it("revalidates /cart after removal", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq1 }) });

    await removeCartItem("item-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("throws when Supabase delete returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq2 = jest.fn().mockResolvedValue({ error: { message: "Delete failed" } });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq1 }) });

    await expect(removeCartItem("item-1")).rejects.toThrow("Delete failed");
  });
});

// Test for clearCart function in cartActions, which handles deleting all cart items for the authenticated user and revalidating the cart page.
describe("clearCart", () => {
  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No user") });
    await expect(clearCart()).rejects.toThrow(/logged in/i);
  });

  it("deletes all cart items for the authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await clearCart();
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("user_id", AUTHED_USER.id);
  });

  it("revalidates /cart after clearing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq }) });

    await clearCart();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("throws when Supabase delete returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const mockEq = jest.fn().mockResolvedValue({ error: { message: "Clear failed" } });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq }) });

    await expect(clearCart()).rejects.toThrow("Clear failed");
  });
});