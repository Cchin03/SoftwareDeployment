import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsTable, { type Product } from "@/components/productsTable";

// Helper function to create a product with default values, allowing tests to easily override specific fields as needed without having to specify every field each time. This keeps the test code concise and focused on the relevant attributes for each test case (e.g. stock levels, category, etc.) while still providing a complete product object that matches the expected shape used by the ProductsTable component.
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Test Product",
    brand: "Acme",
    price: 99.99,
    image: null,
    rating: 4.5,
    reviews: 200,
    category: "electronics",
    stock: 20,
    ...overrides,
  };
}

// Fixture data and helper functions for the tests. We define a set of categories and a factory function to generate products with varying attributes (e.g. different categories, stock levels) to use across the different test cases. This allows us to easily create the necessary data for each test scenario without having to repeat the product creation logic in each test, keeping the tests clean and focused on the specific behavior being tested (e.g. filtering, pagination, etc.).
const CATEGORIES = ["electronics", "fashion", "home", "beauty"];

function makeProducts(count: number, category = "electronics"): Product[] {
  return Array.from({ length: count }, (_, i) =>
    makeProduct({ id: `p${i}`, name: `Product ${i}`, category })
  );
}

// Mocks for the callback props passed to ProductsTable, allowing us to assert that these callbacks are called with the correct arguments when the user interacts with the edit/delete/add buttons in the table. We can also verify that they are called the expected number of times (e.g. once per click) to ensure that the component is correctly handling user interactions and invoking the provided callbacks.
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnAddNew = jest.fn();

// Helper function to render the ProductsTable component with default props, allowing tests to override specific props (e.g. products list, categories) as needed for different test scenarios without having to repeat the full render logic in each test case. This keeps the tests concise and focused on the specific behavior being tested while still providing a consistent way to render the component across all tests.
function renderTable(products: Product[] = [], categories = CATEGORIES) {
  return render(
    <ProductsTable
      products={products}
      categories={categories}
      onEdit={mockOnEdit}
      onDelete={mockOnDelete}
      onAddNew={mockOnAddNew}
    />
  );
}

beforeEach(() => jest.clearAllMocks());

// Tests for ProductsTable component
describe("ProductsTable — rendering", () => {
  it("renders the table headers", () => {
    renderTable();
    ["Product", "Category", "Price", "Stock", "Status", "Actions"].forEach((h) => {
      expect(screen.getByText(h)).toBeInTheDocument();
    });
  });

  it("renders 'No products found' when list is empty", () => {
    renderTable([]);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it("renders product name and brand", () => {
    renderTable([makeProduct({ name: "Wireless Headphones", brand: "Sony" })]);
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Sony")).toBeInTheDocument();
  });

  it("shows 'No brand' when brand is null", () => {
    renderTable([makeProduct({ brand: null })]);
    expect(screen.getByText("No brand")).toBeInTheDocument();
  });

  it("renders the formatted price", () => {
    renderTable([makeProduct({ price: 149.9 })]);
    expect(screen.getByText("RM 149.90")).toBeInTheDocument();
  });

  it("renders the stock quantity with 'units' label", () => {
    renderTable([makeProduct({ stock: 42 })]);
    expect(screen.getByText("42 units")).toBeInTheDocument();
  });

  it("renders a product image when image url is provided", () => {
    renderTable([makeProduct({ image: "/img/headphones.jpg", name: "Headphones" })]);
    const img = screen.getByAltText("Headphones");
    expect(img).toHaveAttribute("src", "/img/headphones.jpg");
  });

  it("renders the 📦 placeholder when image is null", () => {
    renderTable([makeProduct({ image: null })]);
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("shows the total product count in the header", () => {
    renderTable(makeProducts(3));
    expect(screen.getByText(/3 total/i)).toBeInTheDocument();
  });
});

describe("ProductsTable — stock status badges", () => {
  it("shows 'In Stock' when stock > 10", () => {
    renderTable([makeProduct({ stock: 50 })]);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("shows 'Low Stock' when stock is 1–10", () => {
    renderTable([makeProduct({ stock: 5 })]);
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });

  it("shows 'Out of Stock' when stock is 0", () => {
    renderTable([makeProduct({ stock: 0 })]);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("boundary: stock = 10 is Low Stock", () => {
    renderTable([makeProduct({ stock: 10 })]);
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });

  it("boundary: stock = 11 is In Stock", () => {
    renderTable([makeProduct({ stock: 11 })]);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });
});

describe("ProductsTable — category filter", () => {
  it("renders an 'All Products' filter chip", () => {
    renderTable(makeProducts(2));
    expect(screen.getByRole("button", { name: /all products/i })).toBeInTheDocument();
  });

  it("renders a chip for each category", () => {
    renderTable([], CATEGORIES);
    CATEGORIES.forEach((c) => {
      expect(
        screen.getByRole("button", { name: new RegExp(c, "i") })
      ).toBeInTheDocument();
    });
  });

  it("shows all products when 'All Products' is selected", async () => {
    const products = [
      makeProduct({ id: "e1", name: "Laptop", category: "electronics" }),
      makeProduct({ id: "f1", name: "T-Shirt", category: "fashion" }),
    ];
    renderTable(products);
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
  });

  it("filters to show only the selected category", async () => {
    const products = [
      makeProduct({ id: "e1", name: "Laptop",  category: "electronics" }),
      makeProduct({ id: "f1", name: "T-Shirt", category: "fashion" }),
    ];
    renderTable(products, CATEGORIES);
    await userEvent.click(screen.getByRole("button", { name: /fashion/i }));
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
  });

  it("shows correct total count after filtering", async () => {
    const products = [
      ...makeProducts(3, "electronics"),
      ...makeProducts(2, "fashion"),
    ];
    renderTable(products, CATEGORIES);
    await userEvent.click(screen.getByRole("button", { name: /electronics/i }));
    expect(screen.getByText(/3 total/i)).toBeInTheDocument();
  });
});

describe("ProductsTable — pagination", () => {
  it("does NOT show pagination when 5 or fewer items", () => {
    renderTable(makeProducts(5));
    expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
  });

  it("shows pagination when more than 5 items", () => {
    renderTable(makeProducts(6));
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
  });

  it("shows page 1 items (up to 5)", () => {
    renderTable(makeProducts(7));
    expect(screen.getByText("Product 0")).toBeInTheDocument();
    expect(screen.getByText("Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Product 5")).not.toBeInTheDocument();
  });

  it("navigates to page 2 on → click", async () => {
    renderTable(makeProducts(7));
    await userEvent.click(screen.getByRole("button", { name: "→" }));
    expect(screen.getByText("Product 5")).toBeInTheDocument();
    expect(screen.queryByText("Product 0")).not.toBeInTheDocument();
  });

  it("navigates back to page 1 on ← click", async () => {
    renderTable(makeProducts(7));
    await userEvent.click(screen.getByRole("button", { name: "→" }));
    await userEvent.click(screen.getByRole("button", { name: "←" }));
    expect(screen.getByText("Product 0")).toBeInTheDocument();
  });

  it("← is disabled on the first page", () => {
    renderTable(makeProducts(7));
    expect(screen.getByRole("button", { name: "←" })).toBeDisabled();
  });

  it("→ is disabled on the last page", async () => {
    renderTable(makeProducts(6));
    await userEvent.click(screen.getByRole("button", { name: "→" }));
    expect(screen.getByRole("button", { name: "→" })).toBeDisabled();
  });

  it("resets to page 1 when category filter changes", async () => {
    const products = [
      ...makeProducts(6, "electronics"),
      makeProduct({ id: "f1", name: "Fashion Item", category: "fashion" }),
    ];
    renderTable(products, CATEGORIES);
    // Go to page 2
    await userEvent.click(screen.getByRole("button", { name: "→" }));
    expect(screen.queryByText("Product 0")).not.toBeInTheDocument();
    // Switch filter
    await userEvent.click(screen.getByRole("button", { name: /electronics/i }));
    expect(screen.getByText("Product 0")).toBeInTheDocument();
  });

  it("shows correct 'Showing X–Y of Z' info text", () => {
    renderTable(makeProducts(7));
    expect(screen.getByText(/showing/i)).toHaveTextContent("1–5");
    expect(screen.getByText(/showing/i)).toHaveTextContent("7");
  });
});

describe("ProductsTable — callbacks", () => {
  it("calls onAddNew when 'Add New Product' is clicked", async () => {
    renderTable([]);
    await userEvent.click(screen.getByRole("button", { name: /add new product/i }));
    expect(mockOnAddNew).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit with the correct product when ✏️ is clicked", async () => {
    const product = makeProduct({ name: "Camera" });
    renderTable([product]);
    await userEvent.click(screen.getByRole("button", { name: "✏️" }));
    expect(mockOnEdit).toHaveBeenCalledWith(product);
  });

  it("calls onDelete with the correct id and name when 🗑️ is clicked", async () => {
    const product = makeProduct({ id: "del-1", name: "Old Lamp" });
    renderTable([product]);
    await userEvent.click(screen.getByRole("button", { name: "🗑️" }));
    expect(mockOnDelete).toHaveBeenCalledWith("del-1", "Old Lamp");
  });
});
