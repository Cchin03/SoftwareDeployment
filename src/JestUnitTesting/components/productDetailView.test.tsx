import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetailView } from "@/components/productDetailView";
import { getProductImageForSelection } from "@/lib/productData";

// Mocks for navigation and data fetching used by ProductDetailView
jest.mock("next/image", () => {
  const MockImage = ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />;
  MockImage.displayName = "MockImage";
  return MockImage;
});

jest.mock("@/lib/productData", () => ({
  getProductImageForSelection: jest.fn(() => "/images/product.png"),
}));

jest.mock("@/components/addToCartButton", () => ({
  AddToCartButton: ({
    matchedVariant,
    productPrice,
  }: {
    matchedVariant: unknown;
    productPrice: string;
  }) => (
    <div data-testid="add-to-cart-button">
      <span data-testid="matched-variant">{JSON.stringify(matchedVariant)}</span>
      <span data-testid="product-price">{productPrice}</span>
    </div>
  ),
}));

// Chainable Supabase variants mock
const mockCategory = {
  id: "fashion",
  name: "Fashion",
  color: "bg-blue-50",
  accent: "text-blue-600",
  icon: "👗",
  description: "Clothing and accessories",
  products: [],
};

const mockProduct = {
  id: "product-1",
  name: "Nike Air Force 1",
  brand: "Nike",
  price: "RM 379.00",
  description: "Classic low-top sneaker with a clean, versatile look.",
  style: "Casual",
  sizes: ["S", "M", "L"],
  colours: ["Black", "White"],
  patterns: ["Plain", "Camo"],
  rating: 4,
  reviews: 1250,
  emoji: "👟",
  sizePage: "/images/size-guide.jpg",
};

const mockVariants = [
  { id: "v1", size: "M", colour: "Black", pattern: "Plain", stock_quantity: 10, product_id: "product-1", category_id: "fashion", created_at: "" },
  { id: "v2", size: "L", colour: "White", pattern: "Camo",  stock_quantity: 0,  product_id: "product-1", category_id: "fashion", created_at: "" },
];
// Helper function to render ProductDetailView with default props, allowing tests to override specific props as needed to simulate different scenarios (e.g. missing rating data, different variant selections, etc.) without needing to repeat the full render logic in each test case.
function renderView(
  overrides: Partial<React.ComponentProps<typeof ProductDetailView>> = {}
) {
  return render(
    <ProductDetailView
      category={mockCategory}
      product={mockProduct}
      variants={mockVariants}
      {...overrides}
    />
  );
}

// Mocks for the child components used within ProductDetailView, allowing us to isolate the tests to just the ProductDetailView's behavior and rendering without needing to worry about the internal implementation of these child components. We can also assert on the props passed to these mocked components if needed (e.g. matchedVariant in AddToCartButton) to verify that ProductDetailView is correctly processing and passing data down to its children.
describe("ProductDetailView — product information", () => {
  it("renders the product name", () => {
    renderView();
    expect(screen.getByRole("heading", { name: /nike air force 1/i })).toBeInTheDocument();
  });

  it("renders the product brand", () => {
    renderView();
    expect(screen.getAllByText(/nike/i).length).toBeGreaterThan(0);
  });

  it("renders the product price", () => {
  renderView();
    // Target the price paragraph specifically, not the AddToCartButton span
    const prices = screen.getAllByText("RM 379.00");
    expect(prices[0]).toBeInTheDocument();
  });

  it("renders the product description", () => {
    renderView();
    expect(screen.getByText(/classic low-top sneaker/i)).toBeInTheDocument();
  });

  it("renders the product image when getProductImageForSelection returns a path", () => {
    renderView();
    expect(screen.getByAltText(/nike air force 1/i)).toBeInTheDocument();
  });

  it("falls back to emoji when getProductImageForSelection returns null", () => {
    (getProductImageForSelection as jest.Mock).mockReturnValueOnce(null);
    renderView();
    expect(screen.getByText("👟")).toBeInTheDocument();
  });
});

describe("ProductDetailView — rating", () => {
  it("renders rating and review count", () => {
    renderView();
    expect(screen.getByText(/4\.0 rating/i)).toBeInTheDocument();
    expect(screen.getByText(/1,250 reviews/i)).toBeInTheDocument();
  });

  it("shows 'Rating data not available' when rating/reviews are undefined", () => {
    renderView({
      product: { ...mockProduct, rating: undefined as never, reviews: undefined as never },
    });
    expect(screen.getByText(/rating data not available/i)).toBeInTheDocument();
  });
});

describe("ProductDetailView — selectors", () => {
  it("renders all size options", () => {
    renderView();
    mockProduct.sizes.forEach((size) => {
      expect(screen.getByRole("button", { name: size })).toBeInTheDocument();
    });
  });

  it("renders all colour options", () => {
    renderView();
    mockProduct.colours.forEach((colour) => {
      expect(screen.getByRole("button", { name: colour })).toBeInTheDocument();
    });
  });

  it("renders all pattern options", () => {
    renderView();
    mockProduct.patterns.forEach((pattern) => {
      expect(screen.getByRole("button", { name: pattern })).toBeInTheDocument();
    });
  });

  it("first size option is selected by default", () => {
    renderView();
    const sBtn = screen.getByRole("button", { name: "S" });
    expect(sBtn).toHaveClass("bg-zinc-900");
  });

  it("updates size selection on click", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "L" }));
    expect(screen.getByRole("button", { name: "L" })).toHaveClass("bg-zinc-900");
    expect(screen.getByRole("button", { name: "S" })).not.toHaveClass("bg-zinc-900");
  });

  it("updates colour selection on click", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "White" }));
    expect(screen.getByRole("button", { name: "White" })).toHaveClass("bg-zinc-900");
  });

  it("shows current selection summary", () => {
    renderView();
    // Default: S / Black / Plain
    expect(screen.getByText(/s \/ black \/ plain/i)).toBeInTheDocument();
  });

  it("updates current selection summary when options change", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "L" }));
    expect(screen.getByText(/l \/ black \/ plain/i)).toBeInTheDocument();
  });
});

describe("ProductDetailView — variant matching", () => {
  it("passes the matched variant to AddToCartButton", async () => {
    renderView();
    // Default: S / Black / Plain — no exact match in mockVariants (only M/Black/Plain)
    const matchedVariant = screen.getByTestId("matched-variant");
    expect(matchedVariant.textContent).toBe("null");
  });

  it("passes the correct matched variant when selection aligns", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "M" }));
    const matchedVariant = screen.getByTestId("matched-variant");
    const parsed = JSON.parse(matchedVariant.textContent!);
    expect(parsed.id).toBe("v1");
  });

  it("passes null when no variant matches the selection", async () => {
    renderView();
    // S / Black / Plain — not in mockVariants
    const matchedVariant = screen.getByTestId("matched-variant");
    expect(matchedVariant.textContent).toBe("null");
  });
});

describe("ProductDetailView — size guide", () => {
  it("shows 'View Size Guide' button when sizePage is set", () => {
    renderView();
    expect(screen.getByRole("button", { name: /view size guide/i })).toBeInTheDocument();
  });

  it("shows 'Size guide is not available' when sizePage is absent", () => {
    renderView({ product: { ...mockProduct, sizePage: undefined as never } });
    expect(screen.getByText(/size guide is not available/i)).toBeInTheDocument();
  });

  it("opens the size guide modal on button click", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: /view size guide/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("displays the size guide image in the modal", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: /view size guide/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByAltText(/size guide/i)).toBeInTheDocument();
  });

  it("closes the modal when the X button is clicked", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: /view size guide/i }));
    await userEvent.click(screen.getByRole("button", { name: /close size guide/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal when the backdrop is clicked", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: /view size guide/i }));
    const dialog = screen.getByRole("dialog");
    // Click the backdrop (the dialog itself, not the inner panel)
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close modal when clicking inside the modal panel", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: /view size guide/i }));
    // Click the modal heading — use getByRole("heading") instead
    const heading = screen.getByRole("heading", { name: /size guide/i });
    fireEvent.click(heading);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
