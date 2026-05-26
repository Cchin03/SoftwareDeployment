/** 
 * What tested:
 *  1. Empty-cart state renders correctly and shows back-button + CTA
 *  2. Populated cart renders all cart rows and the order summary
 *  3. "Clear all" calls handleClear from the hook
 *  4. Quantity − / + buttons call handleUpdateQuantity with correct args
 *  5. "Remove" button calls handleRemove with the correct item id
 *  6. Low-stock warning appears only when stock_quantity is 1-3
 *  7. Product image falls back to the emoji placeholder when image is absent
 *  8. Order summary totals are calculated and displayed correctly
 *  9. Back button navigates to backHref (defaults to "/")
 * 10. Checkout link points to "/checkout"
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation to prevent actual navigation during tests and allow us to verify navigation calls
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link to prevent actual navigation during tests and allow us to verify link rendering
jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  Link.displayName = "Link";
  return Link;
});


// Mock useCart hook to control the cart state during tests. By mocking this hook, we can simulate different cart states (empty, populated, low stock) and verify that the CartClient component renders the correct UI and calls the appropriate functions from the hook when user interactions occur (e.g. updating quantity, removing items, clearing cart). This allows us to test the CartClient component in isolation without relying on the actual implementation of the useCart hook or making real API calls.
const mockUseCart = jest.fn();
jest.mock("@/hooks/useCart", () => ({
  useCart: (...args: unknown[]) => mockUseCart(...args),
}));

import { CartClient } from "@/app/cart/cartClient";
import { CartItem } from "@/lib/cartActions";

// Helper function to create a cart item with default values, allowing overrides for specific fields. This makes it easy to create test data for different scenarios without having to specify every field each time. By providing sensible defaults, we can focus on the relevant fields for each test case while still ensuring that the cart items have all the necessary properties for the CartClient component to render correctly.
const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "item-1",
  product_id: "prod-1",
  category_id: "cat-1",
  variant_id: "variant-1",
  created_at: new Date().toISOString(),  // ← add this
  product_name: "Test Shirt",
  brand: "TestBrand",
  price: 49.9,
  quantity: 2,
  stock_quantity: 10,
  image: "https://example.com/shirt.jpg",
  size: "M",
  colour: "blue",
  pattern: null,
  ...overrides,
});

// Helper function to generate the default return value for the useCart hook based on the provided items. This calculates the totalItems and totalPrice from the items array and provides default implementations for the handler functions. By using this helper, we can easily create different cart states (e.g. empty cart, cart with multiple items) by simply passing different arrays of items, while still providing all the necessary properties that the CartClient component expects from the useCart hook.
const defaultHookReturn = (items: CartItem[]) => ({
  items,
  totalItems: items.reduce((s, i) => s + i.quantity, 0),
  totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
  isPending: false,
  handleUpdateQuantity: jest.fn(),
  handleRemove: jest.fn(),
  handleClear: jest.fn(),
});

// Clear mocks before each test to ensure test isolation and prevent state leakage between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Empty-cart state
describe("empty cart state", () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue(defaultHookReturn([]));
  });

  test("renders empty-cart heading and message", () => {
    render(<CartClient initialItems={[]} />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText(/haven.*t added anything/i)).toBeInTheDocument();
  });

  test("renders back/continue-shopping button", () => {
    render(<CartClient initialItems={[]} />);
    // Multiple "continue shopping" buttons may exist; at least one should be present
    expect(screen.getAllByText(/continue shopping/i).length).toBeGreaterThan(0);
  });

  test("back button pushes to backHref", () => {
    render(<CartClient initialItems={[]} backHref="/shop/women" />);
    // Click the first "Continue shopping" button
    fireEvent.click(screen.getAllByText(/continue shopping/i)[0]);
    expect(mockPush).toHaveBeenCalledWith("/shop/women");
  });

  test("back button defaults to '/' when backHref not provided", () => {
    render(<CartClient initialItems={[]} />);
    fireEvent.click(screen.getAllByText(/continue shopping/i)[0]);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

// Populated cart state
describe("populated cart state", () => {
  const item1 = makeItem({ id: "item-1", product_name: "Test Shirt", price: 49.9, quantity: 2 });
  const item2 = makeItem({ id: "item-2", product_name: "Test Pants", price: 99.0, quantity: 1 });

  beforeEach(() => {
    mockUseCart.mockReturnValue(defaultHookReturn([item1, item2]));
  });

  test("renders all cart row product names", () => {
    render(<CartClient initialItems={[item1, item2]} />);
    expect(screen.getAllByText("Test Shirt").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Pants").length).toBeGreaterThan(0);
  });

  test("renders item count in header", () => {
    render(<CartClient initialItems={[item1, item2]} />);
    // totalItems = 2+1 = 3 items
    expect(screen.getByText(/3 items/i)).toBeInTheDocument();
  });

  test("renders order summary heading", () => {
    render(<CartClient initialItems={[item1, item2]} />);
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  test("renders correct total price in order summary", () => {
    render(<CartClient initialItems={[item1, item2]} />);
    // total = 49.90*2 + 99.00*1 = 198.80
    expect(screen.getByText("RM 198.80")).toBeInTheDocument();
  });
});

// "Clear all" button
describe("clear all button", () => {
  test("calls handleClear when clicked", () => {
    const handleClear = jest.fn();
    const item = makeItem();
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), handleClear });

    render(<CartClient initialItems={[item]} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  test("is disabled while isPending is true", () => {
    const item = makeItem();
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), isPending: true });

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByText("Clear all")).toBeDisabled();
  });
});

// Quantity controls
describe("quantity controls", () => {
  test("decrease button calls handleUpdateQuantity with qty - 1", () => {
    const handleUpdateQuantity = jest.fn();
    const item = makeItem({ id: "item-1", quantity: 3 });
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), handleUpdateQuantity });

    render(<CartClient initialItems={[item]} />);
    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(handleUpdateQuantity).toHaveBeenCalledWith("item-1", 2);
  });

  test("increase button calls handleUpdateQuantity with qty + 1", () => {
    const handleUpdateQuantity = jest.fn();
    const item = makeItem({ id: "item-1", quantity: 3, stock_quantity: 10 });
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), handleUpdateQuantity });

    render(<CartClient initialItems={[item]} />);
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(handleUpdateQuantity).toHaveBeenCalledWith("item-1", 4);
  });

  test("increase button is disabled when quantity equals stock_quantity", () => {
    const item = makeItem({ quantity: 5, stock_quantity: 5 });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
  });
});

// "Remove" button
describe("remove button", () => {
  test("calls handleRemove with correct item id", () => {
    const handleRemove = jest.fn();
    const item = makeItem({ id: "item-99" });
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), handleRemove });

    render(<CartClient initialItems={[item]} />);
    fireEvent.click(screen.getByText("Remove"));
    expect(handleRemove).toHaveBeenCalledWith("item-99");
  });

  test("is disabled while isPending is true", () => {
    const item = makeItem();
    mockUseCart.mockReturnValue({ ...defaultHookReturn([item]), isPending: true });

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByText("Remove")).toBeDisabled();
  });
});

// Low-stock warning
describe("low-stock warning", () => {
  test("shows warning when stock_quantity is <= 3", () => {
    const item = makeItem({ stock_quantity: 2 });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByText(/only 2 left/i)).toBeInTheDocument();
  });

  test("does not show warning when stock_quantity is > 3", () => {
    const item = makeItem({ stock_quantity: 10 });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.queryByText(/only \d+ left/i)).not.toBeInTheDocument();
  });

  test("does not show warning when stock_quantity is 0", () => {
    const item = makeItem({ stock_quantity: 0 });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.queryByText(/only \d+ left/i)).not.toBeInTheDocument();
  });
});

// Product image
describe("product image", () => {
  test("renders img element when image url is provided", () => {
    const item = makeItem({ image: "https://example.com/img.jpg", product_name: "My Product" });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByAltText("My Product")).toBeInTheDocument();
  });

  test("renders emoji placeholder when image is null", () => {
    const item = makeItem({ image: null });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    const { container } = render(<CartClient initialItems={[item]} />);
    // The fallback div contains the 🛍️ emoji
    expect(container.textContent).toContain("🛍️");
  });
});

// Order summary totals
describe("order summary line items", () => {
  test("shows product × qty and line total for each item", () => {
    const item = makeItem({ product_name: "Cool Hat", price: 25.0, quantity: 3 });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    // Line item text: "Cool Hat × 3"
    expect(screen.getByText(/Cool Hat × 3/)).toBeInTheDocument();
    // Line total: RM 75.00 (may appear in both the row and the order summary)
    expect(screen.getAllByText("RM 75.00").length).toBeGreaterThan(0);
  });
});

// Back button navigation
describe("checkout link", () => {
  test("checkout link points to /checkout", () => {
    const item = makeItem();
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    const checkoutLink = screen.getByText(/proceed to checkout/i).closest("a");
    expect(checkoutLink).toHaveAttribute("href", "/checkout");
  });
});

// Back button navigation
describe("variant badges", () => {
  test("renders size, colour badges when provided", () => {
    const item = makeItem({ size: "L", colour: "red", pattern: "striped" });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    render(<CartClient initialItems={[item]} />);
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("red")).toBeInTheDocument();
    expect(screen.getByText("striped")).toBeInTheDocument();
  });

  test("renders no badges when all variant fields are null", () => {
    const item = makeItem({ size: null, colour: null, pattern: null });
    mockUseCart.mockReturnValue(defaultHookReturn([item]));

    const { container } = render(<CartClient initialItems={[item]} />);
    // Badge container (flex gap-1 mt-1) should not be rendered at all
    expect(container.querySelectorAll(".rounded-full.capitalize").length).toBe(0);
  });
});
