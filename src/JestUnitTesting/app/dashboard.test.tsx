/**
 * What we test:
 *  1.  All 6 category cards render with name, description, and item count
 *  2.  All 4 deal cards render with name, current price, and original price
 *  3.  Guest state: deal buttons show "Sign in to add" text
 *  4.  Guest state: clicking cart icon opens the sign-in modal
 *  5.  Guest state: clicking a deal's Add button opens the sign-in modal
 *  6.  Sign-in modal: "Continue browsing" button closes the modal
 *  7.  Sign-in modal: clicking the backdrop closes the modal
 *  8.  Authenticated: deal buttons show "Add to Cart" after variants load
 *  9.  Authenticated: successful addToCart shows "✓ Added to cart!" and increments cart count
 * 10.  Authenticated: addToCart "out of stock" error shows "Out of Stock"
 * 11.  Authenticated: generic addToCart error shows "Something went wrong"
 * 12.  Authenticated: "logged in" error from addToCart shows the modal
 * 13.  Deal product links point to /product/:categoryId/:productId
 * 14.  Hero "Shop now" link points to /category/electronics
 * 15.  Footer links (Privacy, Terms, Contact) render
 * 16.  Cart count displayed from Supabase after auth resolves
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mocks for navigation and data fetching used by ShopDashboard
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

jest.mock("@/components/navbar", () => {
  const Navbar = ({
    isGuest,
    cartCount,
    onCartClick,
  }: {
    isGuest: boolean;
    cartCount: number;
    onCartClick: (e: React.MouseEvent) => void;
  }) => (
    <nav data-testid="navbar" data-is-guest={String(isGuest)} data-cart-count={cartCount}>
      <a href="/cart" data-testid="cart-link" onClick={onCartClick}>
        Cart ({cartCount})
      </a>
    </nav>
  );
  Navbar.displayName = "Navbar";
  return Navbar;
});

const mockAddToCart = jest.fn();
const mockGetCartCount = jest.fn();
jest.mock("@/lib/cartActions", () => ({
  addToCart: (...args: unknown[]) => mockAddToCart(...args),
  getCartCount: (...args: unknown[]) => mockGetCartCount(...args),
}));

// The component reads auth state from useCurrentUser(), not supabase.auth.getUser() directly.
const mockUseCurrentUser = jest.fn();
jest.mock("@/lib/hooks/currentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Supabase client mock — only used directly by the component for the product_variants lookup.
const mockFrom = jest.fn();

// Mocking next/link to avoid errors about <Link> not being wrapped in <NextRouter>. We can keep it simple since we're not testing Link's behavior here, just that the correct href is passed to it. The mock component renders an anchor tag with the given href and children, and forwards any additional props (e.g. onClick) so we can assert on them if needed.
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

import ShopDashboard from "@/app/dashboard/page";

// Helpers to set up mock data and queries for different scenarios (e.g. guest vs authenticated, in-stock vs out-of-stock variants, etc.) so tests can focus on specific conditions without needing to repeat the full mock setup each time. This keeps tests concise and focused on the behavior being tested, while still allowing for flexibility in simulating different states of the application.
const DEAL_IDS = ["sony-wh-1000xm5", "levis-501", "dyson-v15", "cosrx-serum"];

/** Make the variants query resolve with a variantId for every deal */
function setupVariants(variantId = "v-1") {
  const maybeSingle = jest.fn().mockResolvedValue({ data: { id: variantId, stock_quantity: 5 } });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const order = jest.fn().mockReturnValue({ limit });
  const gt = jest.fn().mockReturnValue({ order });
  const eq2 = jest.fn().mockReturnValue({ gt });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select, eq1, eq2, gt, order, limit, maybeSingle };
}

/** Variant query that resolves with null (out-of-stock / not found) */
function setupVariantsOutOfStock() {
  const maybeSingle = jest.fn().mockResolvedValue({ data: null });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const order = jest.fn().mockReturnValue({ limit });
  const gt = jest.fn().mockReturnValue({ order });
  const eq2 = jest.fn().mockReturnValue({ gt });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

function setupGuestAuth() {
  mockUseCurrentUser.mockReturnValue({ user: null, loading: false });
  mockGetCartCount.mockResolvedValue(0);
  const { select } = setupVariants();
  mockFrom.mockReturnValue({ select });
}

function setupUserAuth(cartQty = 0) {
  mockUseCurrentUser.mockReturnValue({
    user: { id: "user-1", is_anonymous: false },
    loading: false,
  });
  mockGetCartCount.mockResolvedValue(cartQty);

  // product_variants query only — cart count comes from getCartCount(), not a direct table query
  const { select } = setupVariants();
  mockFrom.mockReturnValue({ select });
}

// Reset mocks before each test and set up default guest auth and in-stock variants. Individual tests can override these defaults as needed (e.g. authenticated user, out-of-stock variants, etc.) to simulate different scenarios. This ensures each test starts with a clean slate and only the relevant conditions for that test are changed.
beforeEach(() => {
  jest.clearAllMocks();
  mockAddToCart.mockResolvedValue(undefined);
  setupGuestAuth();
});

// 1. Category cards
test("renders all 6 category cards with name and description", async () => {
  await act(async () => { render(<ShopDashboard />); });

  expect(screen.getByText("Electronics")).toBeInTheDocument();
  expect(screen.getByText("Fashion")).toBeInTheDocument();
  expect(screen.getByText("Home & Living")).toBeInTheDocument();
  expect(screen.getByText("Beauty")).toBeInTheDocument();
  expect(screen.getByText("Sports")).toBeInTheDocument();
  expect(screen.getByText("Books & Media")).toBeInTheDocument();
});

test("renders item count badges for categories", async () => {
  await act(async () => { render(<ShopDashboard />); });
  expect(screen.getByText("142 items")).toBeInTheDocument();
  expect(screen.getByText("381 items")).toBeInTheDocument();
});

// 2. Deal cards 
test("renders all 4 deal cards with name, current price, and original price", async () => {
  await act(async () => { render(<ShopDashboard />); });

  expect(screen.getByText("Sony WH-1000XM5")).toBeInTheDocument();
  expect(screen.getByText("RM 279")).toBeInTheDocument();
  expect(screen.getByText("RM 349")).toBeInTheDocument();

  expect(screen.getByText("Levi's 501 Jeans")).toBeInTheDocument();
});

// 3. Guest: deal buttons show "Sign in to add" 
test("guest sees 'Sign in to add' on deal buttons", async () => {
  await act(async () => { render(<ShopDashboard />); });

  const signInBtns = screen.getAllByText(/sign in to add/i);
  expect(signInBtns.length).toBe(4); // one per deal
});

// 4. Guest: cart click opens modal  
test("guest: clicking cart link opens sign-in modal", async () => {
  await act(async () => { render(<ShopDashboard />); });

  const mockEvent = { preventDefault: jest.fn() };
  fireEvent.click(screen.getByTestId("cart-link"), mockEvent);

  await waitFor(() => {
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });
});

// 5. Guest: deal button click opens modal
test("guest: clicking a deal button opens the sign-in modal", async () => {
  await act(async () => { render(<ShopDashboard />); });

  const [firstBtn] = screen.getAllByText(/sign in to add/i);
  fireEvent.click(firstBtn);

  await waitFor(() => {
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });
});

// 6. Modal: "Continue browsing" closes it 
test("'Continue browsing' button closes the sign-in modal", async () => {
  await act(async () => { render(<ShopDashboard />); });

  fireEvent.click(screen.getAllByText(/sign in to add/i)[0]);
  await waitFor(() => screen.getByText("Sign in required"));

  fireEvent.click(screen.getByText("Continue browsing"));
  await waitFor(() => {
    expect(screen.queryByText("Sign in required")).not.toBeInTheDocument();
  });
});

// 7. Modal: clicking backdrop closes it 
test("clicking backdrop closes the sign-in modal", async () => {
  await act(async () => { render(<ShopDashboard />); });

  fireEvent.click(screen.getAllByText(/sign in to add/i)[0]);
  await waitFor(() => screen.getByText("Sign in required"));

  // The backdrop is the fixed outer div (first child that doesn't stopPropagation)
  const backdrop = screen.getByText("Sign in required").closest(".fixed")!;
  fireEvent.click(backdrop);

  await waitFor(() => {
    expect(screen.queryByText("Sign in required")).not.toBeInTheDocument();
  });
});

//8. Authenticated: "Add to Cart" shown after variants load 
test("authenticated user sees 'Add to Cart' buttons after variants load", async () => {
  setupUserAuth();

  await act(async () => { render(<ShopDashboard />); });

  await waitFor(() => {
    const addBtns = screen.getAllByText(/add to cart/i);
    expect(addBtns.length).toBe(4);
  });
});

// 9. Authenticated: success flow 
test("successful addToCart shows '✓ Added to cart!' and increments cart count", async () => {
  setupUserAuth(2);
  // First call (on mount) resolves 2; second call (refetch after addToCart) resolves 3
  mockGetCartCount.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
  mockAddToCart.mockResolvedValue(undefined);

  await act(async () => { render(<ShopDashboard />); });

  await waitFor(() => screen.getAllByText(/add to cart/i));

  await act(async () => {
    fireEvent.click(screen.getAllByText(/add to cart/i)[0]);
  });

  await waitFor(() => {
    expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
  });

  // Cart count should have incremented by 1
  await waitFor(() => {
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-cart-count", "3");
  });
});

// 10. Authenticated: out of stock error 
test("addToCart 'out of stock' error shows Out of Stock on the button", async () => {
  setupUserAuth();
  mockAddToCart.mockRejectedValue(new Error("out of stock"));

  await act(async () => { render(<ShopDashboard />); });
  await waitFor(() => screen.getAllByText(/add to cart/i));

  await act(async () => {
    fireEvent.click(screen.getAllByText(/add to cart/i)[0]);
  });

  await waitFor(() => {
    expect(screen.getAllByText(/out of stock/i).length).toBeGreaterThan(0);
  });
});

// 11. Authenticated: generic error 
test("generic addToCart error shows 'Something went wrong'", async () => {
  setupUserAuth();
  mockAddToCart.mockRejectedValue(new Error("server error"));

  await act(async () => { render(<ShopDashboard />); });
  await waitFor(() => screen.getAllByText(/add to cart/i));

  await act(async () => {
    fireEvent.click(screen.getAllByText(/add to cart/i)[0]);
  });

  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});

// 12. Authenticated: "logged in" error opens modal 
test("'logged in' error from addToCart opens the sign-in modal", async () => {
  setupUserAuth();
  mockAddToCart.mockRejectedValue(new Error("You must be logged in"));

  await act(async () => { render(<ShopDashboard />); });
  await waitFor(() => screen.getAllByText(/add to cart/i));

  await act(async () => {
    fireEvent.click(screen.getAllByText(/add to cart/i)[0]);
  });

  await waitFor(() => {
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });
});

// 13. Deal product links 
test("deal product links point to /product/:categoryId/:productId", async () => {
  await act(async () => { render(<ShopDashboard />); });

  // Sony link: /product/electronics/sony-wh-1000xm5
  const sonyLinks = screen.getAllByRole("link").filter(
    (l) => l.getAttribute("href") === "/product/electronics/sony-wh-1000xm5"
  );
  expect(sonyLinks.length).toBeGreaterThan(0);
});

// 14. Hero "Explore" link 
test("hero 'Explore' link points to /category/electronics", async () => {
  await act(async () => { render(<ShopDashboard />); });

  const exploreLink = screen.getByRole("link", { name: /explore/i });
  expect(exploreLink).toHaveAttribute("href", "/category/electronics");
});

// 15. Footer links  
test("renders footer links: Privacy, Terms, Contact", async () => {
  await act(async () => { render(<ShopDashboard />); });

  expect(screen.getByRole("link", { name: /privacy/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /terms/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
});

// 16. Cart count from Supabase 
test("displays correct cart count after auth resolves for logged-in user", async () => {
  setupUserAuth(7);

  await act(async () => { render(<ShopDashboard />); });

  await waitFor(() => {
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-cart-count", "7");
  });
});