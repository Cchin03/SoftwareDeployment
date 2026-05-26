/**
 * What we test:
 *  1.  notFound() called when category is not found
 *  2.  notFound() called when product is not found
 *  3.  notFound() called when both category and product are not found
 *  4.  Breadcrumb renders Home / Category / Product name
 *  5.  "Back to {category.name}" link in header points to /category/:id
 *  6.  Back button below breadcrumb also links to /category/:id
 *  7.  Cart link in header points to /cart
 *  8.  ProductDetailView receives correct category, product, and variants props
 *  9.  Sticky header is present with logo linking to "/"
 * 10.  Variants query uses the correct product_id and category_id
 * 11.  Empty variants array passed to ProductDetailView when query returns null
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mocks for navigation and data fetching used by ProductPage
const mockNotFound = jest.fn((): never => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

// ProductDetailView stub — exposes props via data-* attributes for assertions
const mockProductDetailView = jest.fn();
jest.mock("@/components/productDetailView", () => ({
  ProductDetailView: (props: Record<string, unknown>) => {
    mockProductDetailView(props);
    return (
      <div
        data-testid="product-detail-view"
        data-category-id={(props.category as { id: string })?.id}
        data-product-id={(props.product as { id: string })?.id}
        data-variant-count={(props.variants as unknown[])?.length}
      />
    );
  },
}));

const mockGetCategoryById = jest.fn();
const mockGetProductById = jest.fn();
jest.mock("@/lib/productData", () => ({
  getCategoryById: (id: string) => mockGetCategoryById(id),
  getProductById: (cId: string, pId: string) => mockGetProductById(cId, pId),
}));

// Chainable Supabase variants mock
const mockMaybeSingleOrData = jest.fn();
const mockLimit = jest.fn();
const mockOrderVariants = jest.fn();
const mockGt = jest.fn();
const mockEqVariants2 = jest.fn();
const mockEqVariants1 = jest.fn();
const mockSelectVariants = jest.fn();
const mockFromVariants = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({ from: mockFromVariants })
  ),
}));

import ProductPage from "@/app/product/[categoryId]/[productId]/page";


// Fake data for testing
const fakeCategory = {
  id: "electronics",
  name: "Electronics",
};

const fakeProduct = {
  id: "sony-wh-1000xm5",
  name: "Sony WH-1000XM5",
};

const fakeVariants = [
  { id: "v1", product_id: "sony-wh-1000xm5", category_id: "electronics", size: null, colour: "Black", pattern: null, stock_quantity: 5 },
  { id: "v2", product_id: "sony-wh-1000xm5", category_id: "electronics", size: null, colour: "Silver", pattern: null, stock_quantity: 3 },
];

function setupProductData(
  category: typeof fakeCategory | undefined,
  product: typeof fakeProduct | undefined
) {
  mockGetCategoryById.mockReturnValue(category);
  mockGetProductById.mockReturnValue(product);
}

function setupVariantsQuery(variants: typeof fakeVariants | null) {
  mockMaybeSingleOrData.mockResolvedValue({ data: variants });
  // The chain: from().select().eq().eq() → resolves with { data }
  mockEqVariants2.mockResolvedValue({ data: variants });
  mockEqVariants1.mockReturnValue({ eq: mockEqVariants2 });
  mockSelectVariants.mockReturnValue({ eq: mockEqVariants1 });
  mockFromVariants.mockReturnValue({ select: mockSelectVariants });
}

async function renderPage(categoryId = "electronics", productId = "sony-wh-1000xm5") {
  const jsx = await ProductPage({
    params: Promise.resolve({ categoryId, productId }),
  });
  return render(jsx as React.ReactElement);
}

// Reset mocks before each test to ensure clean state and avoid test interference. Also set up default product data and variants query for tests that rely on them, while individual tests can override this setup as needed to simulate different scenarios (e.g. missing category/product, empty variants).
beforeEach(() => {
  jest.clearAllMocks();
  setupProductData(fakeCategory, fakeProduct);
  setupVariantsQuery(fakeVariants);
});

// 1. notFound: unknown category 
test("calls notFound() when category is not found", async () => {
  setupProductData(undefined, fakeProduct);
  await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mockNotFound).toHaveBeenCalled();
});

// 2. notFound: unknown product 
test("calls notFound() when product is not found", async () => {
  setupProductData(fakeCategory, undefined);
  await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mockNotFound).toHaveBeenCalled();
});

// 3. notFound: both missing 
test("calls notFound() when both category and product are missing", async () => {
  setupProductData(undefined, undefined);
  await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(mockNotFound).toHaveBeenCalled();
});

// 4. Breadcrumb 
test("renders breadcrumb: Home / Electronics / Sony WH-1000XM5", async () => {
  await renderPage();

  expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
  // Category in breadcrumb (nav link)
  const categoryLinks = screen.getAllByRole("link", { name: /electronics/i });
  expect(categoryLinks.length).toBeGreaterThan(0);
  // Product name as non-link breadcrumb text
  expect(screen.getByText("Sony WH-1000XM5")).toBeInTheDocument();
});

// 5. Header "Back to {category.name}" link 
test("header Back to Electronics link points to /category/electronics", async () => {
  await renderPage();

  const backLinks = screen.getAllByRole("link", { name: /back to electronics/i });
  backLinks.forEach((link) => {
    expect(link).toHaveAttribute("href", "/category/electronics");
  });
});

// 6. Breadcrumb back button link 
test("back button below breadcrumb links to /category/electronics", async () => {
  await renderPage();

  const backLinks = screen.getAllByRole("link", { name: /back to electronics/i });
  // At least one should point to the category page
  expect(backLinks.some((l) => l.getAttribute("href") === "/category/electronics")).toBe(true);
});

// 7. Cart link in header 
test("Cart link in header points to /cart", async () => {
  await renderPage();

  const cartLink = screen.getByRole("link", { name: /^cart$/i });
  expect(cartLink).toHaveAttribute("href", "/cart");
});

// 8. ProductDetailView receives correct props 
test("passes correct category, product, and variants to ProductDetailView", async () => {
  await renderPage();

  const view = screen.getByTestId("product-detail-view");
  expect(view).toHaveAttribute("data-category-id", "electronics");
  expect(view).toHaveAttribute("data-product-id", "sony-wh-1000xm5");
  expect(view).toHaveAttribute("data-variant-count", "2");
});

// 9. Sticky header + logo 
test("sticky header is present and logo links to /", async () => {
  const { container } = await renderPage();

  const header = container.querySelector("header");
  expect(header).toHaveClass("sticky");

  const logoLink = screen.getByRole("link", { name: /shop/i });
  expect(logoLink).toHaveAttribute("href", "/");
});

// ─10. Variants query uses correct ids 
test("variants query uses correct product_id and category_id", async () => {
  await renderPage("electronics", "sony-wh-1000xm5");

  // First .eq() call: product_id
  expect(mockEqVariants1).toHaveBeenCalledWith("product_id", "sony-wh-1000xm5");
  // Second .eq() call: category_id
  expect(mockEqVariants2).toHaveBeenCalledWith("category_id", "electronics");
});

// 11. Empty variants when query returns null 
test("passes empty variants array when query returns null", async () => {
  setupVariantsQuery(null);
  await renderPage();

  const view = screen.getByTestId("product-detail-view");
  expect(view).toHaveAttribute("data-variant-count", "0");
});
