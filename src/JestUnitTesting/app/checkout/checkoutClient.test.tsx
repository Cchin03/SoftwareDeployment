/**
 * What we test:
 *  1.  Form pre-fills recipientName and senderName from defaultName prop
 *  2.  Validation – shows errors for all required empty fields on submit
 *  3.  Validation – shows phone error for invalid number
 *  4.  Validation – clears a field error when that field is edited
 *  5.  Successful submit calls checkout() with the correctly assembled payload
 *  6.  checkout() rejection surfaces the error message in the UI
 *  7.  "Place Order" button is disabled while isPending (transition running)
 *  8.  Order summary renders all items with correct line totals and grand total
 *  9.  Online banking section appears only when that payment method is selected
 * 10.  Back-to-cart button navigates to /cart
 * 11.  Cart breadcrumb link points to /cart
 * 12.  Variant badges (size · colour · pattern) rendered in order summary
 * 13.  Image fallback 🛍️ shown when item.image is null
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mocks 
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link to avoid errors about <Link> not being wrapped in <NextRouter>. The mock component renders an anchor tag with the given href and children, and forwards any additional props (e.g. onClick) so we can assert on them if needed.
jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

const mockCheckout = jest.fn();
jest.mock("@/lib/checkoutActions", () => ({
  checkout: (...args: unknown[]) => mockCheckout(...args),
}));

// useTransition mock: run startTransition callbacks synchronously so we don't
// need to wrap in act() for every async state update.
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useTransition: () => [
      false,
      (cb: () => void) => { cb(); },
    ],
  };
});

import CheckoutClient from "@/app/checkout/checkoutClient";
import type { CartItemExpanded } from "@/lib/supabase/types";


// Helper to create a cart item with valid defaults, allowing overrides for specific tests. This keeps our tests focused on the relevant fields without needing to specify every property of CartItemExpanded each time.
const makeItem = (overrides: Partial<CartItemExpanded> = {}): CartItemExpanded => ({
  id: "ci-1",
  product_id: "p-1",
  product_name: "Test Shirt",
  price: 49.9,
  quantity: 2,
  image: "https://example.com/shirt.jpg",
  size: "M",
  colour: "blue",
  pattern: null,
  ...overrides,
} as CartItemExpanded);

const defaultProps = {
  items: [makeItem()],
  userEmail: "alice@example.com",
  defaultName: "Alice",
};

// Fill in the minimum valid form fields so submission succeeds. 
async function fillValidForm() {
  // recipientName and senderName are pre-filled with defaultName ("Alice")
  // whatsapp: needs 9-10 digits for +60 (default country)
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. 123456789/i), {
    target: { value: "123456789" },
  });
  // address - use label query which is more stable than placeholder text
  const addressInput =
    screen.queryByLabelText(/delivery address|address/i) ??
    screen.queryByPlaceholderText(/street|building|jalan|address/i);
  if (addressInput) {
    fireEvent.change(addressInput, { target: { value: "No 1 Jalan Test" } });
  }
  // city
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Kuala Lumpur/i), {
    target: { value: "Kuala Lumpur" },
  });
}

// Reset mocks before each test and set up default mock implementations. Tests can override these as needed. For example, most tests will want getCartItems to return a valid item so the page renders, but some tests might want to return an empty array to test the empty cart redirect.
beforeEach(() => {
  jest.clearAllMocks();
  mockCheckout.mockResolvedValue(undefined);
});

// 1. Form pre-fill from defaultName
test("pre-fills recipientName and senderName with defaultName", () => {
  render(<CheckoutClient {...defaultProps} />);

  const nameInputs = screen.getAllByDisplayValue("Alice");
  expect(nameInputs.length).toBeGreaterThanOrEqual(2);
});

// 2. Validation – all required fields
test("shows validation errors for all empty required fields on submit", async () => {
  render(
    <CheckoutClient
      items={[makeItem()]}
      userEmail="alice@example.com"
      defaultName="" // empty so name fields are also blank
    />
  );

  // Submit without filling any fields
  fireEvent.click(screen.getByText(/place order/i));

  // Wait for all validation errors to appear in the document. We check for recipient name, sender name, address, city, and phone number errors. The exact error messages may vary based on your implementation, so adjust the regex as needed to match your actual error text.
  await waitFor(() => {
    expect(screen.getByText(/recipient name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/sender name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/city is required/i)).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
  });
});

// 3. Validation – phone error 
test("shows phone validation error for a too-short number", async () => {
  render(<CheckoutClient {...defaultProps} />);

  // Type only 5 digits (invalid for +60)
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. 123456789/i), {
    target: { value: "12345" },
  });

  fireEvent.click(screen.getByText(/place order/i));

  await waitFor(() => {
    expect(screen.getByText(/9–10/)).toBeInTheDocument();
  });
});

// 4. Clearing a field error on change 
test("clears city error when user starts typing in city field", async () => {
  render(
    <CheckoutClient
      items={[makeItem()]}
      userEmail="a@b.com"
      defaultName=""
    />
  );

  fireEvent.click(screen.getByText(/place order/i));
  await waitFor(() =>
    expect(screen.getByText(/city is required/i)).toBeInTheDocument()
  );

  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Kuala Lumpur/i), {
    target: { value: "KL" },
  });

  await waitFor(() =>
    expect(screen.queryByText(/city is required/i)).not.toBeInTheDocument()
  );
});

// 5. Successful submit payload 
test("calls checkout() with correctly assembled payload on valid submit", async () => {
  render(<CheckoutClient {...defaultProps} />);
  await fillValidForm();

  fireEvent.click(screen.getByText(/place order/i));

  await waitFor(() => {
    expect(mockCheckout).toHaveBeenCalledWith({
      recipientName: "Alice",
      senderName: "Alice",
      whatsapp: "+60123456789",
      address: "No 1 Jalan Test",
      city: "Kuala Lumpur",
      paymentMethod: "cash",
    });
  });
});

// 6. checkout() error surfaces in UI 
test("displays error message when checkout() rejects", async () => {
  mockCheckout.mockRejectedValue(new Error("Payment gateway unavailable"));
  render(<CheckoutClient {...defaultProps} />);
  await fillValidForm();

  fireEvent.click(screen.getByText(/place order/i));

  await waitFor(() => {
    expect(screen.getByText(/payment gateway unavailable/i)).toBeInTheDocument();
  });
});

// 7. Submit button disabled while pending 
test("Place Order button is disabled when isPending is true", () => {
  // Override useTransition to report pending=true
  jest.spyOn(React, "useTransition").mockReturnValueOnce([
    true,
    (cb: () => void) => { cb(); },
  ]);

  render(<CheckoutClient {...defaultProps} />);
  expect(screen.getByRole("button", { name: /placing order/i })).toBeDisabled();
});

// 8. Order summary totals 
describe("order summary", () => {
  test("renders product names in summary", () => {
    const items = [
      makeItem({ id: "ci-1", product_name: "Cool Hat", price: 25, quantity: 1 }),
      makeItem({ id: "ci-2", product_name: "Test Pants", price: 80, quantity: 2 }),
    ];
    render(<CheckoutClient items={items} userEmail="a@b.com" defaultName="Bob" />);

    expect(screen.getByText("Cool Hat")).toBeInTheDocument();
    expect(screen.getByText("Test Pants")).toBeInTheDocument();
  });

  test("renders correct line totals for each item", () => {
    const items = [
      makeItem({ id: "ci-1", product_name: "Hat", price: 25, quantity: 3 }),
    ];
    render(<CheckoutClient items={items} userEmail="a@b.com" defaultName="Bob" />);

    // Line total: 25 * 3 = 75.00 (may appear in both line item and summary total)
    expect(screen.getAllByText("RM 75.00").length).toBeGreaterThan(0);
  });

  test("renders correct grand total", () => {
    const items = [
      makeItem({ id: "ci-1", price: 50, quantity: 2 }),
      makeItem({ id: "ci-2", price: 30, quantity: 1 }),
    ];
    render(<CheckoutClient items={items} userEmail="a@b.com" defaultName="Bob" />);

    // Total = 100 + 30 = 130.00
    expect(screen.getAllByText("RM 130.00").length).toBeGreaterThan(0);
  });

  test("renders subtotal item count", () => {
    const items = [
      makeItem({ id: "ci-1", quantity: 2 }),
      makeItem({ id: "ci-2", quantity: 3 }),
    ];
    render(<CheckoutClient items={items} userEmail="a@b.com" defaultName="Bob" />);

    expect(screen.getByText(/subtotal \(5 items\)/i)).toBeInTheDocument();
  });

  test("shows Free shipping", () => {
    render(<CheckoutClient {...defaultProps} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});

// 9. Online banking section 
describe("payment method", () => {
  test("does NOT show bank transfer details when cash is selected", () => {
    render(<CheckoutClient {...defaultProps} />);
    expect(screen.queryByText(/bank transfer details/i)).not.toBeInTheDocument();
  });

  test("shows bank transfer details when online_banking is selected", async () => {
    render(<CheckoutClient {...defaultProps} />);

    const onlineBankingBtn = screen.getByText(/online banking/i).closest("button")!;
    fireEvent.click(onlineBankingBtn);

    await waitFor(() => {
      expect(screen.getByText(/bank transfer details/i)).toBeInTheDocument();
      expect(screen.getByText(/Maybank/)).toBeInTheDocument();
    });
  });
});

// 10. Back to cart navigation 
test("clicking Back to Cart pushes /cart route", () => {
  render(<CheckoutClient {...defaultProps} />);
  fireEvent.click(screen.getByText(/back to cart/i));
  expect(mockPush).toHaveBeenCalledWith("/cart");
});

// 11. Cart breadcrumb link 
test("Cart breadcrumb link points to /cart", () => {
  render(<CheckoutClient {...defaultProps} />);
  const cartLink = screen.getByRole("link", { name: /^cart$/i });
  expect(cartLink).toHaveAttribute("href", "/cart");
});

// 12. Variant badges in order summary 
test("renders size · colour in order summary when provided", () => {
  const item = makeItem({ size: "L", colour: "red", pattern: "striped" });
  render(<CheckoutClient items={[item]} userEmail="a@b.com" defaultName="Bob" />);

  expect(screen.getByText(/L · red · striped/)).toBeInTheDocument();
});

test("renders no variant text when all variant fields are null", () => {
  const item = makeItem({ size: null, colour: null, pattern: null });
  render(<CheckoutClient items={[item]} userEmail="a@b.com" defaultName="Bob" />);

  // No "·" separator should appear
  expect(screen.queryByText(/·/)).not.toBeInTheDocument();
});

// 13. Image fallback 
test("shows 🛍️ emoji when item.image is null", () => {
  const item = makeItem({ image: null });
  render(<CheckoutClient items={[item]} userEmail="a@b.com" defaultName="Bob" />);

  expect(screen.getByText("🛍️")).toBeInTheDocument();
});

test("renders img element when image url is provided", () => {
  const item = makeItem({ image: "https://example.com/img.jpg", product_name: "My Item" });
  render(<CheckoutClient items={[item]} userEmail="a@b.com" defaultName="Bob" />);

  expect(screen.getByAltText("My Item")).toBeInTheDocument();
});
