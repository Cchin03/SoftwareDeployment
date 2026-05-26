
import { checkout, type CheckoutFormData } from "@/lib/checkoutActions";

// Mocks for Supabase client and next/cache revalidation
const mockRevalidatePath = jest.fn();
const mockRedirect = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("next/cache",      () => ({ revalidatePath: (...a: unknown[]) => mockRevalidatePath(...a) }));
jest.mock("next/navigation", () => ({ redirect: (...a: unknown[]) => mockRedirect(...a) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser }, from: mockFrom })
  ),
}));

// Helper function to set up the auth mock for a given user state (authenticated or not) to be used in tests that require simulating different authentication scenarios without having to repeat the mock setup logic in each test case. 
// This keeps the tests concise and focused on the relevant behavior being tested while still providing a consistent way to control the authentication state across multiple tests.
const AUTHED_USER = { id: "user-abc", email: "user@example.com" };

const validForm: CheckoutFormData = {
  recipientName: "Alice Lim",
  senderName: "Bob Tan",
  whatsapp: "+60123456789",
  address: "123 Jalan Ampang",
  city: "Kuala Lumpur",
  paymentMethod: "online_banking",
};

const cartRow = (overrides = {}) => ({
  id: "cart-item-1",
  quantity: 2,
  variant_id: "variant-1",
  product_variants: {
    id: "variant-1",
    size: "M",
    colour: "Black",
    pattern: "Solid",
    stock_quantity: 10,
    product_id: "product-1",
    category_id: "cat-electronics",
    products: { name: "Test Product", price: "RM 99.00" },
  },
  ...overrides,
});

//  Supabase flow  
// checkout() makes 5 sequential from() calls:
//   1. cart_items select
//   2. orders insert
//   3. order_items insert
//   4. product_variants update (per row)
//   5. cart_items delete

function setupHappyPath(rows = [cartRow()]) {
  mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });

  let call = 0;
  mockFrom.mockImplementation(() => {
    call++;
    if (call === 1) {
      // cart_items select + joins
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
      };
    }
    if (call === 2) {
      // orders insert
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    }
    if (call === 3) {
      // order_items insert
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    }
    if (call === 4) {
      // product_variants update (stock decrement)
      return {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
    }
    // cart_items delete
    return {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
  });
}

beforeEach(() => jest.clearAllMocks());

// We test the checkout function in checkoutActions, which handles the entire checkout process from validating the user's cart to creating an order and clearing the cart. 
// We mock the necessary dependencies (e.g. supabase auth, supabase from method, next/cache) to isolate the behavior of the checkout function and assert that it correctly checks for user authentication, validates the cart contents and stock availability, creates an order with the correct data, updates stock quantities, clears the cart, revalidates the cart page, and redirects to the order confirmation page. We also test edge cases such as when the user is not authenticated, when the cart is empty, when a cart item has invalid data, when there is insufficient stock, and when Supabase operations return errors to ensure that the function behaves correctly in those scenarios as well.
describe("checkout — auth", () => {
  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No auth") });
    await expect(checkout(validForm)).rejects.toThrow(/logged in/i);
  });
});

describe("checkout — cart validation", () => {
  it("throws when cart is empty", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    await expect(checkout(validForm)).rejects.toThrow(/empty/i);
  });

  it("throws when cart query returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: { message: "Cart query failed" } }),
    });
    await expect(checkout(validForm)).rejects.toThrow("Cart query failed");
  });

  it("throws when a cart item has null product_variants", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const rowWithNull = cartRow({ product_variants: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [rowWithNull], error: null }),
    });
    await expect(checkout(validForm)).rejects.toThrow(/invalid cart item/i);
  });
});

describe("checkout — stock validation", () => {
  it("throws when a product has insufficient stock", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    const lowStockRow = cartRow({ quantity: 5 }); // wants 5 but stock = 10, OK
    const outOfStockRow = cartRow({
      quantity: 15,
      variant_id: "variant-2",
      product_variants: { ...cartRow().product_variants, stock_quantity: 3, products: { name: "Scarce Item", price: "RM 50.00" } },
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [outOfStockRow], error: null }),
    });
    await expect(checkout(validForm)).rejects.toThrow(/only has 3 units left/i);
  });

  it("does NOT throw when stock exactly equals quantity", async () => {
    const exactRow = cartRow({ quantity: 10 }); // quantity === stock_quantity
    setupHappyPath([exactRow]);
    // Should not throw stock error (may throw on redirect, which is fine)
    await checkout(validForm).catch(() => {}); // redirect throws in test env
    // If we got here without a stock error, the stock check passed
    expect(mockRedirect).toHaveBeenCalled();
  });
});

describe("checkout — order creation", () => {
  it("inserts into the orders table with correct fields", async () => {
    let ordersInsert: jest.Mock | null = null;

    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation((table: string) => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) {
        const insertFn = jest.fn().mockResolvedValue({ error: null });
        ordersInsert = insertFn;
        return { insert: insertFn };
      }
      if (call === 3) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 4) return { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      return { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    });

    await checkout(validForm).catch(() => {});
    // Assert that the orders insert was called with the correct data (customer, address, whatsapp, sender_name, payment_method, status). 
    // We can also check that the total field is calculated correctly based on the cart items and their prices, but for simplicity we'll just check that the insert was called with an object containing the expected fields and values.
    expect(ordersInsert).toHaveBeenCalled();
    const insertArg = ordersInsert!.mock.calls[0][0];
    expect(insertArg.customer).toBe(validForm.recipientName);
    expect(insertArg.city).toBe(validForm.city);
    expect(insertArg.address).toBe(validForm.address);
    expect(insertArg.whatsapp).toBe(validForm.whatsapp);
    expect(insertArg.sender_name).toBe(validForm.senderName);
    expect(insertArg.payment_method).toBe(validForm.paymentMethod);
    expect(insertArg.status).toBe("Pending");
  });

  it("generates an order id matching the ORD-YYYYMMDD-XXXX format", async () => {
    let capturedId: string | null = null;

    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) {
        return {
          insert: jest.fn((data) => {
            capturedId = data.id;
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (call === 3) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 4) return { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      return { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    });

    await checkout(validForm).catch(() => {});
    expect(capturedId).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
  });

  it("calculates the correct order total", async () => {
    let capturedTotal: number | null = null;

    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    // Row: quantity=2, price=RM 99.00 → subtotal = 198
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) {
        return {
          insert: jest.fn((data) => {
            capturedTotal = data.total;
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (call === 3) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 4) return { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      return { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    });

    await checkout(validForm).catch(() => {});
    expect(capturedTotal).toBe(198); // 2 × 99
  });

  it("throws when orders insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      return { insert: jest.fn().mockResolvedValue({ error: { message: "Orders insert failed" } }) };
    });
    await expect(checkout(validForm)).rejects.toThrow("Orders insert failed");
  });

  it("throws when order_items insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      return { insert: jest.fn().mockResolvedValue({ error: { message: "Items insert failed" } }) };
    });
    await expect(checkout(validForm)).rejects.toThrow("Items insert failed");
  });
});

describe("checkout — post-order steps", () => {
  it("decrements stock for each cart item", async () => {
    const updateMock = jest.fn().mockReturnThis();
    const eqMock     = jest.fn().mockResolvedValue({ error: null });

    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 3) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 4) return { update: updateMock, eq: eqMock };
      return { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    });

    await checkout(validForm).catch(() => {});
    // stock_quantity 10 - quantity 2 = 8
    expect(updateMock).toHaveBeenCalledWith({ stock_quantity: 8 });
  });

  it("clears the cart after a successful order", async () => {
    const deleteMock = jest.fn().mockReturnThis();
    const eqMock     = jest.fn().mockResolvedValue({ error: null });

    mockGetUser.mockResolvedValue({ data: { user: AUTHED_USER }, error: null });
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [cartRow()], error: null }) };
      if (call === 2) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 3) return { insert: jest.fn().mockResolvedValue({ error: null }) };
      if (call === 4) return { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      return { delete: deleteMock, eq: eqMock };
    });

    await checkout(validForm).catch(() => {});
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("user_id", AUTHED_USER.id);
  });

  it("revalidates /cart after checkout", async () => {
    setupHappyPath();
    await checkout(validForm).catch(() => {});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("redirects to /order/:orderId after successful checkout", async () => {
    setupHappyPath();
    await checkout(validForm).catch(() => {});
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringMatching(/^\/order\/ORD-/));
  });
});

describe("checkout — payment methods", () => {
  it("accepts 'cash' as a valid payment method", async () => {
    setupHappyPath();
    await checkout({ ...validForm, paymentMethod: "cash" }).catch(() => {});
    expect(mockRedirect).toHaveBeenCalled();
  });

  it("accepts 'online_banking' as a valid payment method", async () => {
    setupHappyPath();
    await checkout({ ...validForm, paymentMethod: "online_banking" }).catch(() => {});
    expect(mockRedirect).toHaveBeenCalled();
  });
});
