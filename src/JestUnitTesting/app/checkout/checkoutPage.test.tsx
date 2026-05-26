/**
 * What we test:
 *  1.  Unauthenticated user → redirect("/login?next=/checkout")
 *  2.  Empty cart → redirect("/cart")
 *  3.  Authenticated + non-empty cart → no redirect
 *  4.  CheckoutClient receives items from getCartItems
 *  5.  CheckoutClient receives userEmail from auth user
 *  6.  CheckoutClient receives defaultName from profiles table
 *  7.  defaultName falls back to "" when profile has no name
 *  8.  getCartItems is called exactly once
 *  9.  Profile query is NOT called when user is unauthenticated (redirect short-circuits)
 * 10.  CheckoutClient receives empty defaultName when profile row is missing
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mocks for navigation and data fetching used by CheckoutPage
const mockRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mutable supabase mock so we can vary behaviour per test
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

// Mocking next/link to avoid errors about <Link> not being wrapped in <NextRouter>. We can keep it simple since we're not testing Link's behavior here, just that the correct href is passed to it. The mock component renders an anchor tag with the given href and children, and forwards any additional props (e.g. onClick) so we can assert on them if needed.
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

const mockGetCartItems = jest.fn();
jest.mock("@/lib/cartActions", () => ({
  getCartItems: () => mockGetCartItems(),
}));

// Keep CheckoutClient as a simple stub that exposes its props for assertions. Mock using the same path that checkout/page.tsx uses to import CheckoutClient.
// Mock using the same path that checkout/page.tsx uses to import CheckoutClient.
jest.mock("@/app/checkout/checkoutClient", () => ({
  __esModule: true,
  default: ({
    items,
    userEmail,
    defaultName,
  }: {
    items: unknown[];
    userEmail: string;
    defaultName: string;
  }) => (
    <div
      data-testid="checkout-client"
      data-item-count={items.length}
      data-user-email={userEmail}
      data-default-name={defaultName}
    />
  ),
}));

import CheckoutPage from "@/app/checkout/page";


const fakeUser = { id: "user-1", email: "alice@example.com" };

const fakeItem = { id: "ci-1", product_name: "Shirt", price: 50, quantity: 1 };

function setupAuth(user: typeof fakeUser | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
}

// Helper to set up the profile query mock for different test scenarios (e.g. profile with name, profile without name, no profile row). We mock the chain of supabase query methods (.from().select().eq().single()) to ultimately resolve to the desired profile data shape.
function setupProfileQuery(resolvedValue: { data: { name: string } | null }) {
  const single = jest.fn().mockResolvedValue(resolvedValue);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
}

async function renderPage() {
  const jsx = await CheckoutPage();
  return render(jsx as React.ReactElement);
}

// Reset mocks before each test and set up default authenticated user and non-empty cart. Individual tests can override these defaults as needed (e.g. unauthenticated scenario, empty cart scenario).
beforeEach(() => {
  jest.clearAllMocks();
  mockGetCartItems.mockResolvedValue([fakeItem]);
  setupProfileQuery({ data: { name: "Alice" } });
});

// 1. Unauthenticated redirect 
test("redirects unauthenticated users to /login?next=/checkout", async () => {
  setupAuth(null);

  await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/login?next=/checkout");
  expect(mockRedirect).toHaveBeenCalledWith("/login?next=/checkout");
});

// 2. Empty cart redirect 
test("redirects to /cart when cart is empty", async () => {
  setupAuth(fakeUser);
  mockGetCartItems.mockResolvedValue([]);

  await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/cart");
  expect(mockRedirect).toHaveBeenCalledWith("/cart");
});

// 3. No redirect for authenticated + non-empty cart 
test("does not redirect when user is authenticated and cart is not empty", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(mockRedirect).not.toHaveBeenCalled();
});

// 4. Items passed to CheckoutClient 
test("passes items returned by getCartItems to CheckoutClient", async () => {
  setupAuth(fakeUser);
  const items = [fakeItem, { ...fakeItem, id: "ci-2", product_name: "Pants" }];
  mockGetCartItems.mockResolvedValue(items);

  await renderPage();

  expect(screen.getByTestId("checkout-client")).toHaveAttribute(
    "data-item-count",
    "2"
  );
});

// 5. userEmail passed to CheckoutClient 
test("passes userEmail to CheckoutClient", async () => {
  setupAuth(fakeUser);

  await renderPage();

  expect(screen.getByTestId("checkout-client")).toHaveAttribute(
    "data-user-email",
    "alice@example.com"
  );
});

// 6. defaultName from profile 
test("passes profile name as defaultName to CheckoutClient", async () => {
  setupAuth(fakeUser);
  setupProfileQuery({ data: { name: "Alice" } });

  await renderPage();

  expect(screen.getByTestId("checkout-client")).toHaveAttribute(
    "data-default-name",
    "Alice"
  );
});

// 7. defaultName falls back to "" when profile.name is null 
test('passes empty string as defaultName when profile name is null', async () => {
  setupAuth(fakeUser);
  setupProfileQuery({ data: { name: null as unknown as string } });

  await renderPage();

  expect(screen.getByTestId("checkout-client")).toHaveAttribute(
    "data-default-name",
    ""
  );
});

// 8. getCartItems called once  
test("calls getCartItems exactly once per render", async () => {
  setupAuth(fakeUser);

  await renderPage();
  expect(mockGetCartItems).toHaveBeenCalledTimes(1);
});

// 9. Profile query not reached when redirect fires 
test("does not query profiles when user is unauthenticated", async () => {
  setupAuth(null);

  await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");
  // mockFrom is the supabase.from() mock; it should never be called
  expect(mockFrom).not.toHaveBeenCalled();
});

// 10. defaultName is "" when profile row is missing (null data) 
test('passes empty string as defaultName when profile row is absent', async () => {
  setupAuth(fakeUser);
  setupProfileQuery({ data: null });

  await renderPage();

  expect(screen.getByTestId("checkout-client")).toHaveAttribute(
    "data-default-name",
    ""
  );
});
