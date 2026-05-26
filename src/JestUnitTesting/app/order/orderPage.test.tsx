/**
 * What we test:
 *  1.  notFound() called when order query returns an error
 *  2.  notFound() called when order data is null
 *  3.  Order ID and date rendered in the receipt header
 *  4.  Order status badge rendered
 *  5.  Delivery info fields (Recipient, Sender, Phone, WhatsApp, City, Address) rendered
 *  6.  Items rendered with name, size/colour, quantity, and line total
 *  7.  Payment label: "Cash on Delivery" for "cash"
 *  8.  Payment label: "Online Banking" for "online_banking"
 *  9.  Grand total displayed correctly
 * 10.  "Continue Shopping" link points to /dashboard
 * 11.  PrintButton is rendered
 * 12.  Support email link present
 * 13.  Empty items list renders without crashing
 * 14.  order_items query uses the correct orderId
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";


// Mocks for navigation and data fetching used by OrderConfirmationPage
const mockNotFound = jest.fn((): never => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

// Chainable Supabase mock
jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

jest.mock("@/app/order/[orderId]/printButton", () => ({
  __esModule: true,
  default: () => <button>Print Receipt</button>,
}));

// Chainable Supabase mock
const mockSingle = jest.fn();
const mockEqOrder = jest.fn();
const mockSelectOrder = jest.fn();
const mockFromOrders = jest.fn();

const mockEqItems = jest.fn();
const mockSelectItems = jest.fn();
const mockFromItems = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === "orders") return mockFromOrders();
  if (table === "order_items") return mockFromItems();
  return {};
});

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}));

import OrderConfirmationPage from "@/app/order/[orderId]/page";

// Fake data for testing
const fakeOrder = {
  id: "ORD-001",
  date: "2026-05-24",
  status: "Pending",
  customer: "Alice Lim",
  sender_name: "Bob Tan",
  phone: "+60123456789",
  whatsapp: "+60123456789",
  city: "Kuala Lumpur",
  address: "No 1 Jalan Test, 50000 KL",
  payment_method: "cash",
  total: "149.80",
};

//  Helper functions to set up different query results for orders and order_items. By controlling the resolved values of these mocks, we can simulate various scenarios such as successful data fetching, empty items list, and query errors, allowing us to test how OrderConfirmationPage handles each case in isolation.
const fakeItems = [
  { id: "oi-1", product_name: "Test Shirt", size: "M", colour: "blue", quantity: 2, price_at_purchase: "49.90" },
  { id: "oi-2", product_name: "Test Pants", size: "L", colour: "black", quantity: 1, price_at_purchase: "50.00" },
];

// Set up the order query mock to return the desired order data or error for each test case. The page component will call this when it tries to fetch the order details, and we can assert on how it handles different responses (e.g. showing the order info, calling notFound, etc.).
function setupOrderQuery(result: { data: typeof fakeOrder | null; error: unknown }) {
  mockSingle.mockResolvedValue(result);
  mockEqOrder.mockReturnValue({ single: mockSingle });
  mockSelectOrder.mockReturnValue({ eq: mockEqOrder });
  mockFromOrders.mockReturnValue({ select: mockSelectOrder });
}

// Set up the order_items query mock to return the desired list of items for each test case. The page component will call this when it tries to fetch the items for the order, and we can assert on how it renders the items list based on the returned data (e.g. showing item details, handling empty list, etc.).
function setupItemsQuery(items: typeof fakeItems | null) {
  mockEqItems.mockResolvedValue({ data: items });
  mockSelectItems.mockReturnValue({ eq: mockEqItems });
  mockFromItems.mockReturnValue({ select: mockSelectItems });
}

// Helper to render the page component with a given orderId. By default it uses "ORD-001" which matches our fakeOrder, but we can pass a different ID to test that the correct orderId is used in the query. The renderPage function calls the page component's default export (which is an async function that returns JSX) and then renders the resulting JSX using React Testing Library's render function, allowing us to make assertions on the rendered output in our tests.
async function renderPage(orderId = "ORD-001") {
  const jsx = await OrderConfirmationPage({
    params: Promise.resolve({ orderId }),
  });
  return render(jsx as React.ReactElement);
}

// Reset mocks before each test and set up default query results for a successful order fetch with items. Individual tests can override these defaults by calling setupOrderQuery and setupItemsQuery with different data or errors to simulate various scenarios.
beforeEach(() => {
  jest.clearAllMocks();
  setupOrderQuery({ data: fakeOrder, error: null });
  setupItemsQuery(fakeItems);
});

// 1. notFound on query error 
test("calls notFound() when order query returns an error", async () => {
  setupOrderQuery({ data: null, error: new Error("DB error") });
  await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mockNotFound).toHaveBeenCalled();
});

// 2. notFound when order is null 
test("calls notFound() when order data is null and no error", async () => {
  setupOrderQuery({ data: null, error: null });
  await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mockNotFound).toHaveBeenCalled();
});

// 3. Order ID and date 
test("renders order ID and date in the receipt header", async () => {
  await renderPage();
  expect(screen.getByText("ORD-001")).toBeInTheDocument();
  expect(screen.getByText("2026-05-24")).toBeInTheDocument();
});

// 4. Order status 
test("renders order status badge", async () => {
  await renderPage();
  expect(screen.getByText("Pending")).toBeInTheDocument();
});

// 5. Delivery info 
test("renders all delivery info fields", async () => {
  await renderPage();
  expect(screen.getByText("Alice Lim")).toBeInTheDocument();
  expect(screen.getByText("Bob Tan")).toBeInTheDocument();
  expect(screen.getByText("Kuala Lumpur")).toBeInTheDocument();
  expect(screen.getByText("No 1 Jalan Test, 50000 KL")).toBeInTheDocument();
  // Phone and WhatsApp
  expect(screen.getAllByText("+60123456789").length).toBeGreaterThanOrEqual(2);
});

// 6. Items list 
test("renders each item with name, variant info, and line total", async () => {
  await renderPage();

  expect(screen.getByText("Test Shirt")).toBeInTheDocument();
  // M · blue · × 2
  expect(screen.getByText(/M · blue · × 2/)).toBeInTheDocument();
  // Line total: 49.90 * 2 = 99.80
  expect(screen.getByText("RM 99.80")).toBeInTheDocument();

  expect(screen.getByText("Test Pants")).toBeInTheDocument();
  expect(screen.getByText(/L · black · × 1/)).toBeInTheDocument();
  expect(screen.getByText("RM 50.00")).toBeInTheDocument();
});

// 7. Payment label: cash 
test("shows Cash on Delivery for payment_method=cash", async () => {
  await renderPage();
  expect(screen.getByText("Cash on Delivery")).toBeInTheDocument();
});

// 8. Payment label: online_banking 
test("shows Online Banking for payment_method=online_banking", async () => {
  setupOrderQuery({
    data: { ...fakeOrder, payment_method: "online_banking" },
    error: null,
  });
  await renderPage();
  expect(screen.getByText("Online Banking")).toBeInTheDocument();
});

// 9. Grand total 
test("renders total amount correctly", async () => {
  await renderPage();
  expect(screen.getByText("RM 149.80")).toBeInTheDocument();
});

// 10. Continue Shopping link 
test("Continue Shopping link points to /dashboard", async () => {
  await renderPage();
  const link = screen.getByRole("link", { name: /continue shopping/i });
  expect(link).toHaveAttribute("href", "/dashboard");
});

// 11. PrintButton rendered 
test("renders PrintButton", async () => {
  await renderPage();
  expect(screen.getByRole("button", { name: /print receipt/i })).toBeInTheDocument();
});

// 12. Support email link 
test("renders support email link", async () => {
  await renderPage();
  const emailLink = screen.getByRole("link", { name: /support@shop\.io/i });
  expect(emailLink).toHaveAttribute("href", "mailto:support@shop.io");
});

// 13. Empty items list 
test("renders without crashing when items list is empty", async () => {
  setupItemsQuery([]);
  await renderPage();
  expect(screen.getByText("Order Confirmed!")).toBeInTheDocument();
});

// 14. order_items query uses correct orderId 
test("queries order_items with the correct orderId", async () => {
  await renderPage("ORD-XYZ");
  // The eq mock on the items query should have been called with the orderId
  expect(mockEqItems).toHaveBeenCalledWith("order_id", "ORD-XYZ");
});
