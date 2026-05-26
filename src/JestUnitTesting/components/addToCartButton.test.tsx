import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCartButton } from "@/components/addToCartButton";
import { addToCart } from "@/lib/cartActions";

// Mocks for navigation and data fetching used by AddToCartButton
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/product/fashion/nike-air-force-1",
}));

// Mocking next/link to avoid errors about <Link> not being wrapped in <NextRouter>. We can keep it simple since we're not testing Link's behavior here, just that the correct href is passed to it. The mock component renders an anchor tag with the given href and children, and forwards any additional props (e.g. onClick) so we can assert on them if needed.
jest.mock("@/lib/cartActions", () => ({
  addToCart: jest.fn(),
}));

// Mutable supabase mock so we can vary behaviour per test
const mockRouterPush = jest.fn();
const mockAddToCart = addToCart as jest.MockedFunction<typeof addToCart>;

// Sample variant data for testing different stock levels and scenarios. Tests can override the default in-stock variant with low-stock or out-of-stock variants as needed to simulate those conditions.
const inStockVariant = {
  id: "variant-1",
  stock_quantity: 10,
  size: "M",
  colour: "Black",
  pattern: "Plain",
  product_id: "product-1",
  category_id: "category-1",
  created_at: "2024-01-01T00:00:00Z",
};

// Low stock variant (2 left) and out of stock variant (0 left) can be created by spreading the inStockVariant and overriding the stock_quantity and id. This allows us to easily test the different UI states and behaviors for these scenarios without needing to duplicate the full variant object each time.
const lowStockVariant = { ...inStockVariant, id: "variant-2", stock_quantity: 2 };
const outOfStockVariant = { ...inStockVariant, id: "variant-3", stock_quantity: 0 };

// Helper function to render the AddToCartButton with default props, allowing individual tests to override specific props as needed (e.g. matchedVariant, productPrice, etc.) to simulate different scenarios. This keeps tests concise and focused on the behavior being tested, while still providing flexibility in setting up the component state for each test case.
function renderButton(
  props: Partial<React.ComponentProps<typeof AddToCartButton>> = {}
) {
  return render(
    <AddToCartButton
      productPrice="99.90"
      matchedVariant={inStockVariant}
      {...props}
    />
  );
}

// can drive the fake clock internally during pointer events.
let user: ReturnType<typeof userEvent.setup>

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("AddToCartButton — rendering", () => {
  it("renders the Add to Cart button when variant is in stock", () => {
    renderButton();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("shows 'Out of Stock' button when variant has zero stock", () => {
    renderButton({ matchedVariant: outOfStockVariant });
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeInTheDocument();
  });

  it("disables the button when variant is out of stock", () => {
    renderButton({ matchedVariant: outOfStockVariant });
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeDisabled();
  });

  it("shows 'No variant found' message when matchedVariant is null", () => {
    renderButton({ matchedVariant: null });
    expect(screen.getByText(/no variant found/i)).toBeInTheDocument();
  });

  it("disables the button when matchedVariant is null", () => {
    renderButton({ matchedVariant: null });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows out-of-stock message for zero-stock variant", () => {
    renderButton({ matchedVariant: outOfStockVariant });
    expect(screen.getByText(/this combination is out of stock/i)).toBeInTheDocument();
  });

  it("shows low stock warning when stock is 1–3", () => {
    renderButton({ matchedVariant: lowStockVariant });
    expect(screen.getByText(/only 2 left in stock/i)).toBeInTheDocument();
  });

  it("does NOT show low stock warning when stock is above 3", () => {
    renderButton();
    expect(screen.queryByText(/only.*left in stock/i)).not.toBeInTheDocument();
  });
});

describe("AddToCartButton — quantity stepper", () => {
  it("renders the quantity stepper for in-stock variants", () => {
    renderButton();
    expect(screen.getByText("1")).toBeInTheDocument(); // default qty
    expect(screen.getByRole("button", { name: "−" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
  });

  it("does NOT render the quantity stepper for out-of-stock variants", () => {
    renderButton({ matchedVariant: outOfStockVariant });
    expect(screen.queryByText("Qty")).not.toBeInTheDocument();
  });

  it("increments quantity on + click", async () => {
    renderButton();
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("decrements quantity on − click", async () => {
    renderButton();
    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: "−" }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not decrement below 1", async () => {
    renderButton();
    await user.click(screen.getByRole("button", { name: "−" }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("disables + button at max stock", async () => {
    renderButton({ matchedVariant: { ...inStockVariant, stock_quantity: 1 } });
    expect(screen.getByRole("button", { name: "+" })).toBeDisabled();
  });

  it("shows the running total price", () => {
    renderButton({ productPrice: "99.90" });
    expect(screen.getByText("RM 99.90")).toBeInTheDocument();
  });

  it("updates price when quantity changes", async () => {
    renderButton({ productPrice: "50.00" });
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByText("RM 100.00")).toBeInTheDocument();
  });
});

describe("AddToCartButton — add to cart action", () => {
  it("calls addToCart with correct variantId and quantity on click", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith("variant-1", 1);
  });

  it("calls addToCart with updated quantity", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderButton();
    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith("variant-1", 2);
  });

  it("shows success feedback after successful add", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /added to cart/i })).toBeInTheDocument()
    );
  });

  it("resets quantity to 1 after successful add", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderButton();
    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });

  it("clears success feedback after 2.5 seconds", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /added to cart/i })).toBeInTheDocument()
    );
    act(() => jest.advanceTimersByTime(2500));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument()
    );
  });

  it("shows error feedback on generic failure", async () => {
    mockAddToCart.mockResolvedValue({ success: false });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /something went wrong/i })).toBeInTheDocument()
    );
  });

  it("shows stock feedback when reason is 'stock'", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "stock" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /out of stock/i })).toBeInTheDocument()
    );
  });
});

describe("AddToCartButton — auth flow", () => {
  it("shows auth prompt when reason is 'auth'", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "auth" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() =>
      expect(screen.getByText(/sign in to add items to your cart/i)).toBeInTheDocument()
    );
  });

  it("renders Sign in and Register buttons in auth prompt", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "auth" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    });
  });

  it("redirects to /login with next param on Sign in click", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "auth" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => screen.getByRole("button", { name: /sign in/i }));
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("/login?next=")
    );
  });

  it("redirects to /register with next param on Register click", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "auth" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => screen.getByRole("button", { name: /register/i }));
    await user.click(screen.getByRole("button", { name: /register/i }));
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("/register?next=")
    );
  });

  it("encodes the current pathname in the redirect URL", async () => {
    mockAddToCart.mockResolvedValue({ success: false, reason: "auth" });
    renderButton();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => screen.getByRole("button", { name: /sign in/i }));
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockRouterPush).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent("/product/fashion/nike-air-force-1")}`
    );
  });
});
