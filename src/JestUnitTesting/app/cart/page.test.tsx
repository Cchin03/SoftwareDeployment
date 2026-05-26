/**
 * Tests for CartPage
 *
 * What we test:
 *  1. Unauthenticated users are redirected to /login?next=/cart
 *  2. Authenticated users are NOT redirected
 *  3. The page renders the site logo "shop.io"
 *  4. The signed-in user's email is displayed in the header
 *  5. CartClient is rendered with the items returned by getCartItems
 *  6. The header is sticky (has the correct sticky/z-50 classes)
 *  7. The logo links back to "/"
 *  8. The page wrapper has the expected background class (bg-zinc-50)
 *  9. getCartItems is called exactly once per render
 * 10. An empty cart (getCartItems returns []) still renders CartClient (not an error)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// moCKS navigation and data fetching used by CartPage
const mockRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mocking next/link to avoid errors about <Link> not being wrapped in <NextRouter>. We can keep it simple since we're not testing Link's behavior here, just that the correct href is passed to it. The mock component renders an anchor tag with the given href and children, and forwards any additional props (e.g. onClick) so we can assert on them if needed.
jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  Link.displayName = "Link";
  return Link;
});

// Mock supabase client and getUser to control authentication state in tests. By mocking getUser, we can simulate both authenticated and unauthenticated scenarios without relying on a real backend or session. This allows us to test the redirect behavior for unauthenticated users and the normal rendering for authenticated users in isolation.
const mockGetUser = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

// Mock getCartItems to control the cart contents in tests. By mocking getCartItems, we can simulate different cart states (e.g. empty cart, cart with items) without relying on a real backend or session. This allows us to test how CartPage behaves with different cart contents, such as ensuring it renders CartClient with the correct items and handles an empty cart gracefully.
const mockGetCartItems = jest.fn();
jest.mock("@/lib/cartActions", () => ({
  getCartItems: () => mockGetCartItems(),
}));

//  mock CartClient 
// We keep it simple: render a div that exposes its props so we can assert on them.
// Mock using the same path that page.tsx uses to import CartClient.
// Using a relative "./cartClient" only works if this test file sits in the
// same directory as the module; using the alias is more robust.
jest.mock("@/app/cart/cartClient", () => ({
  CartClient: ({ initialItems }: { initialItems: unknown[] }) => (
    <div data-testid="cart-client" data-item-count={initialItems.length} />
  ),
}));

import CartPage from "@/app/cart/page";

// fake user data for authenticated tests
const fakeUser = { email: "alice@example.com", id: "user-1" };

function setupAuth(user: typeof fakeUser | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
}

async function renderPage() {
  // CartPage is an async server component — await it like a regular async function.
  const jsx = await CartPage();
  return render(jsx as React.ReactElement);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCartItems.mockResolvedValue([]);
});

// Unauthenticated redirect 
test("redirects unauthenticated users to /login?next=/cart", async () => {
  setupAuth(null);

  await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/login?next=/cart");
  expect(mockRedirect).toHaveBeenCalledWith("/login?next=/cart");
});

// No redirect for authenticated users 
test("does not redirect when user is authenticated", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(mockRedirect).not.toHaveBeenCalled();
});

// Logo text 
test("renders shop.io logo text", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(screen.getByText(/shop/i)).toBeInTheDocument();
});

// User email in header 
test("displays signed-in user email in the header", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(screen.getByText(fakeUser.email)).toBeInTheDocument();
});

// CartClient receives items from getCartItems 
test("passes items returned by getCartItems to CartClient", async () => {
  setupAuth(fakeUser);
  const fakeItems = [
    { id: "i1", product_name: "Shirt", price: 50, quantity: 1, stock_quantity: 5 },
    { id: "i2", product_name: "Pants", price: 80, quantity: 2, stock_quantity: 8 },
  ];
  mockGetCartItems.mockResolvedValue(fakeItems);

  await renderPage();

  const cartClient = screen.getByTestId("cart-client");
  expect(cartClient).toHaveAttribute("data-item-count", "2");
});

// Header styling
test("header has sticky and z-50 classes", async () => {
  setupAuth(fakeUser);

  const { container } = await renderPage();
  const header = container.querySelector("header");
  expect(header).toHaveClass("sticky");
  expect(header).toHaveClass("z-50");
});

// Logo links to "/" 
test("logo link points to /", async () => {
  setupAuth(fakeUser);

  await renderPage();
  const logoLink = screen.getByRole("link", { name: /shop/i });
  expect(logoLink).toHaveAttribute("href", "/");
});

// Page background 
test("page wrapper has bg-zinc-50 class", async () => {
  setupAuth(fakeUser);

  const { container } = await renderPage();
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper).toHaveClass("bg-zinc-50");
});

// getCartItems called once 
test("calls getCartItems exactly once", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(mockGetCartItems).toHaveBeenCalledTimes(1);
});

// Empty cart does not crash 
test("renders CartClient even when cart is empty", async () => {
  setupAuth(fakeUser);
  mockGetCartItems.mockResolvedValue([]);

  await renderPage();

  const cartClient = screen.getByTestId("cart-client");
  expect(cartClient).toHaveAttribute("data-item-count", "0");
});
