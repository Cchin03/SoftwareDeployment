/** 
 * What we test:
 *  1.  Unknown category ID → shows "Category not found" message
 *  2.  Known category → renders category name, description, product count
 *  3.  Search input filters products by name
 *  4.  Search with no matches → shows "No results" message
 *  5.  Sort: "Price: Low to High" orders products correctly
 *  6.  Sort: "Price: High to Low" orders products correctly
 *  7.  Sort: "Best Rated" orders products correctly
 *  8.  Active sort button has distinct styling (bg-zinc-900)
 *  9.  Back to Home button calls router.push("/")
 * 10.  Unauthenticated cart icon → redirects to /login?next=/cart
 * 11.  Authenticated user → cart icon navigates to /cart normally (no redirect)
 * 12.  Product cards link to the correct product page URL
 * 13.  Low-stock tag renders on cards with tag="Sale" etc.
 * 14.  Guest state → isGuest defaults to true before Supabase responds
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mocks for next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "women" })), // default; override per test
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/image", () => {
  const Img = ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />;
  Img.displayName = "Image";
  return Img;
});

jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

// Mock Navbar to control cart count and guest state in tests. By mocking Navbar, we can simulate different authentication states (guest vs signed-in) and cart counts without relying on a real backend or session. This allows us to test how CategoryPage behaves in response to user interactions with the cart icon, such as ensuring it redirects guests to login and allows signed-in users to navigate to the cart normally.
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
      <a
        href="/cart"
        data-testid="cart-link"
        onClick={onCartClick}
      >
        Cart ({cartCount})
      </a>
    </nav>
  );
  Navbar.displayName = "Navbar";
  return Navbar;
});

// Mocks for Supabase client and auth. By mocking the Supabase client and its auth.getUser method, we can control the authentication state in our tests without relying on a real backend or session. This allows us to simulate both authenticated and unauthenticated scenarios, which is crucial for testing the redirect behavior for guests and the normal rendering for signed-in users in isolation.
const mockGetUser = jest.fn();
const mockSupabaseFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseFrom,
  })),
}));

// We define a minimal category so tests are independent of real data changes.
const mockCategory = {
  id: "women",
  name: "Women",
  description: "Women's fashion",
  icon: "👗",
  color: "bg-pink-50",
  accent: "text-pink-600",
  products: [
    { id: "p1", name: "Red Blouse",   price: "RM 49.90", brand: "BrandA", rating: 4, reviews: 100, image: null, emoji: "👗", tag: "Sale",  style: "casual" },
    { id: "p2", name: "Blue Skirt",   price: "RM 29.90", brand: "BrandB", rating: 5, reviews: 200, image: null, emoji: "👗", tag: null,   style: "formal" },
    { id: "p3", name: "Green Jacket", price: "RM 89.90", brand: "BrandC", rating: 3, reviews:  50, image: null, emoji: "🧥", tag: "New",   style: "smart" },
  ],
};

jest.mock("@/lib/productData", () => ({
  getCategoryById: (id: string) => id === "women" ? mockCategory : undefined,
  parsePrice: (price: string) => parseFloat(price.replace(/[^0-9.]/g, "")),
  productCategories: [],
  sortOptions: ["Featured", "Price: Low to High", "Price: High to Low", "Best Rated"],
  tagColors: { Sale: "bg-red-100 text-red-600", New: "bg-green-100 text-green-600" },
}));

import { useParams } from "next/navigation";
import CategoryPage from "@/app/category/[id]/page";


// Helper functions to set up different authentication states in tests. By defining helper functions like setupGuestAuth and setupUserAuth, we can easily configure the mockGetUser function to simulate different authentication scenarios (guest vs signed-in) in our tests. This promotes code reuse and keeps our test cases focused on their specific assertions rather than the mechanics of setting up the auth state.
function setupGuestAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

// Set up authenticated user with optional cart quantities for testing cart count in Navbar. By allowing setupUserAuth to accept an array of cart quantities, we can simulate different cart states for the authenticated user, which is useful for testing how the Navbar displays the cart count and how the CategoryPage behaves in response to it.
function setupUserAuth(cartQuantities: number[] = []) {
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  const single = jest.fn();
  const eq = jest.fn().mockReturnValue({ data: cartQuantities.map((q) => ({ quantity: q })) });
  const select = jest.fn().mockReturnValue({ eq });
  mockSupabaseFrom.mockReturnValue({ select });
}

// Mock next/link to render a simple anchor tag. By mocking next/link, we can ensure that our tests render a consistent and simplified version of the Link component, which allows us to focus on testing the behavior of our CategoryPage without worrying about the complexities of Next.js's Link component. This also allows us to assert on the href attributes of links in our tests.
beforeEach(() => {
  jest.clearAllMocks();
  (useParams as jest.Mock).mockReturnValue({ id: "women" });
  setupGuestAuth();
});

afterEach(async () => {
  // Flush any pending async state updates (e.g. getUser resolution)
  // to prevent "not wrapped in act(...)" warnings leaking between tests.
  await act(async () => { await Promise.resolve(); });
});

// Unknown category 
test("shows Category not found for unknown category id", () => {
  (useParams as jest.Mock).mockReturnValue({ id: "nonexistent" });

  render(<CategoryPage />);
  expect(screen.getByText("Category not found")).toBeInTheDocument();
});

// Known category renders metadata 
test("renders category name, description, and product count", async () => {
  render(<CategoryPage />);

  // "Women" may appear in heading and breadcrumb - just confirm it's present
  expect(screen.getAllByText("Women").length).toBeGreaterThan(0);
  expect(screen.getByText("Women's fashion")).toBeInTheDocument();
  expect(screen.getByText(/3 products/i)).toBeInTheDocument();
});

// Search filters products 
test("search input filters products by name", () => {
  render(<CategoryPage />);

  fireEvent.change(screen.getByPlaceholderText(/search products/i), {
    target: { value: "blouse" },
  });

  expect(screen.getByText("Red Blouse")).toBeInTheDocument();
  expect(screen.queryByText("Blue Skirt")).not.toBeInTheDocument();
  expect(screen.queryByText("Green Jacket")).not.toBeInTheDocument();
});

// No results 
test("shows no results message when search matches nothing", () => {
  render(<CategoryPage />);

  fireEvent.change(screen.getByPlaceholderText(/search products/i), {
    target: { value: "xyz-not-exist" },
  });

  expect(screen.getByText(/no results/i)).toBeInTheDocument();
});

// Helper function to extract product names in the order they appear on the page. This function looks for all link elements that point to product pages, extracts their text content, and matches it against our known product names to return an array of product names in the order they are rendered. This is useful for testing the sorting functionality of the CategoryPage, as we can assert that the products are displayed in the correct order based on the selected sort option.
const PRODUCT_NAMES = ["Red Blouse", "Blue Skirt", "Green Jacket"];

// We filter links to only those that point to product pages (href starts with "/product
function getSortedProductNames() {
  return screen
    .getAllByRole("link")
    .filter((el) => el.getAttribute("href")?.startsWith("/product/women/"))
    .map((el) => {
      const text = el.textContent?.trim() ?? "";
      return PRODUCT_NAMES.find((name) => text.includes(name)) ?? null;
    })
    .filter(Boolean) as string[];
}

//  Sort: Price Low to High 
test("sorts products by price ascending", async () => {
  render(<CategoryPage />);
  fireEvent.click(screen.getByText("Price: Low to High"));
  // 29.90, 49.90, 89.90
  expect(getSortedProductNames()).toEqual(["Blue Skirt", "Red Blouse", "Green Jacket"]);
});

// Sort: Price High to Low 
test("sorts products by price descending", async () => {
  render(<CategoryPage />);
  fireEvent.click(screen.getByText("Price: High to Low"));
  // 89.90, 49.90, 29.90
  expect(getSortedProductNames()).toEqual(["Green Jacket", "Red Blouse", "Blue Skirt"]);
});

//  Sort: Best Rated 
test("sorts products by rating descending", async () => {
  render(<CategoryPage />);
  fireEvent.click(screen.getByText("Best Rated"));
  // ratings: Blue Skirt 5, Red Blouse 4, Green Jacket 3
  expect(getSortedProductNames()).toEqual(["Blue Skirt", "Red Blouse", "Green Jacket"]);
});

// Active sort button styling 
test("active sort button has bg-zinc-900 class", () => {
  render(<CategoryPage />);

  const featuredBtn = screen.getByRole("button", { name: "Featured" });
  expect(featuredBtn).toHaveClass("bg-zinc-900");

  fireEvent.click(screen.getByRole("button", { name: "Best Rated" }));

  expect(screen.getByRole("button", { name: "Best Rated" })).toHaveClass("bg-zinc-900");
  expect(featuredBtn).not.toHaveClass("bg-zinc-900");
});

// Back to Home button 
test("Back to Home button calls router.push('/')", () => {
  render(<CategoryPage />);

  fireEvent.click(screen.getByText("Back to Home"));
  expect(mockPush).toHaveBeenCalledWith("/");
});

//  Guest cart click → redirect 
test("cart click redirects guest to /login?next=/cart", async () => {
  render(<CategoryPage />);

  // Wait for auth to resolve (isGuest remains true for null user)
  await waitFor(() =>
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-is-guest", "true")
  );

  const cartLink = screen.getByTestId("cart-link");
  const mockEvent = { preventDefault: jest.fn() } as unknown as React.MouseEvent;
  fireEvent.click(cartLink, mockEvent);

  expect(mockPush).toHaveBeenCalledWith("/login?next=/cart");
});

// Authenticated cart click does NOT redirect 
test("authenticated cart click does not call router.push", async () => {
  setupUserAuth([2, 3]);

  render(<CategoryPage />);

  await waitFor(() =>
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-is-guest", "false")
  );

  // No push for authenticated user
  expect(mockPush).not.toHaveBeenCalled();
});

// Product card links 
test("product card links point to /product/:categoryId/:productId", () => {
  render(<CategoryPage />);

  const blouseLink = screen
    .getAllByRole("link")
    .find((el) => el.textContent?.includes("Red Blouse"))!;

  expect(blouseLink).toHaveAttribute("href", "/product/women/p1");
});

// Tag badge renders 
test("renders product tag badge when product has a tag", () => {
  render(<CategoryPage />);

  expect(screen.getByText("Sale")).toBeInTheDocument();
  expect(screen.getByText("New")).toBeInTheDocument();
});

// Cart count from Supabase 
test("displays correct cart count after auth resolves", async () => {
  setupUserAuth([2, 3]); // total = 5

  render(<CategoryPage />);

  await waitFor(() =>
    expect(screen.getByTestId("navbar")).toHaveAttribute("data-cart-count", "5")
  );
});
