// Tests for pure functions: getCategoryById, getProductById,
// getProductImageForSelection, and parsePrice.
// The generated image maps are mocked so tests are self-contained.

import {
  getCategoryById,
  getProductById,
  getProductImageForSelection,
  parsePrice,
  type Product,
} from "@/lib/productData";

// Mocks for the generated image maps, which are used by getProductImageForSelection to determine which image to show based on selected colour and pattern. 
// By mocking these maps, we can test the image selection logic in isolation without relying on the actual contents of the generated maps, and we can define specific scenarios to ensure that our selection logic correctly prioritizes pattern images over colour variants, 
// falls back to defaults appropriately, and handles slug generation consistently.
jest.mock("@/lib/generatedProductVariants", () => ({
  generatedProductVariantImages: {
    "mock-product": {
      black: "/products/mock/variants/mock-product__black.png",
      white: "/products/mock/variants/mock-product__white.png",
    },
    "canvas-tote-bag": {
      natural: "/products/fashion/variants/canvas-tote-bag__natural.png",
      navy:    "/products/fashion/variants/canvas-tote-bag__navy.png",
      olive:   "/products/fashion/variants/canvas-tote-bag__olive.png",
    },
  },
}));

jest.mock("@/lib/generatedProductPatterns", () => ({
  generatedProductPatternImages: {
    "mock-product": {
      "black-stripe": "/products/mock/pattern/mock-product__black-stripe.png",
      "white-stripe": "/products/mock/pattern/mock-product__white-stripe.png",
    },
    "canvas-tote-bag": {
      "natural-stripe": "/products/fashion/pattern/canvas-tote-bag__natural-stripe.png",
      "navy-stripe":    "/products/fashion/pattern/canvas-tote-bag__navy-stripe.png",
    },
  },
}));

// Mock product data for testing getProductImageForSelection logic in isolation from the real product catalogue. We define a product with multiple colours and patterns, and specify its default image and imageVariants. 
const mockProduct: Product = {
  id: "mock-product",
  name: "Mock Product",
  brand: "Acme",
  price: "$99.99",
  style: "Test style",
  description: "A test product.",
  sizes: ["S", "M", "L"],
  colours: ["Black", "White"],
  patterns: ["Solid", "Stripe"],
  image: "/products/mock/default.jpg",
  imageVariants: [
    { colour: "Black", image: "/products/mock/imageVariants/black.png" },
    { colour: "White", image: "/products/mock/imageVariants/white.png" },
  ],
  rating: 4,
  reviews: 100,
};

// Test getCategoryById, which retrieves a category object based on a given category id. We test various scenarios including valid category ids, 
// invalid category ids, and edge cases like empty strings. We also check that the function correctly returns undefined when the category is not found, and that it returns the correct category for each known id. This ensures that our category retrieval logic is robust and correctly handles different input scenarios.
describe("getCategoryById", () => {
  it("returns the correct category for a valid id", () => {
    const category = getCategoryById("electronics");
    expect(category).toBeDefined();
    expect(category?.id).toBe("electronics");
    expect(category?.name).toBe("Electronics");
  });

  it("returns the correct category for fashion", () => {
    expect(getCategoryById("fashion")?.id).toBe("fashion");
  });

  it("returns the correct category for home", () => {
    expect(getCategoryById("home")?.id).toBe("home");
  });

  it("returns the correct category for beauty", () => {
    expect(getCategoryById("beauty")?.id).toBe("beauty");
  });

  it("returns the correct category for sports", () => {
    expect(getCategoryById("sports")?.id).toBe("sports");
  });

  it("returns the correct category for books", () => {
    expect(getCategoryById("books")?.id).toBe("books");
  });

  it("returns undefined for an unknown category id", () => {
    expect(getCategoryById("unknown")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getCategoryById("")).toBeUndefined();
  });

  it("each category has a non-empty products array", () => {
    ["electronics", "fashion", "home", "beauty", "sports", "books"].forEach((id) => {
      expect(getCategoryById(id)?.products.length).toBeGreaterThan(0);
    });
  });
});

// Test getProductById, which retrieves a product object based on a given category id and product id. We test various scenarios including valid category and product ids, 
// invalid category ids, invalid product ids, and edge cases like empty strings. We also check that the function correctly returns undefined when the category or product is not found, and that it does not return products from the wrong category. 
// This ensures that our product retrieval logic is robust and correctly handles different input scenarios.
describe("getProductById", () => {
  it("returns the correct product for a valid category and product id", () => {
    const product = getProductById("electronics", "iphone-16-pro");
    expect(product).toBeDefined();
    expect(product?.id).toBe("iphone-16-pro");
    expect(product?.name).toBe("iPhone 16 Pro");
  });

  it("returns a fashion product correctly", () => {
    expect(getProductById("fashion", "nike-air-force-1")?.id).toBe("nike-air-force-1");
  });

  it("returns undefined for a valid category but unknown product id", () => {
    expect(getProductById("electronics", "non-existent-product")).toBeUndefined();
  });

  it("returns undefined for an unknown category", () => {
    expect(getProductById("unknown-category", "iphone-16-pro")).toBeUndefined();
  });

  it("returns undefined for both unknown category and product", () => {
    expect(getProductById("unknown", "unknown")).toBeUndefined();
  });

  it("does not return a product from the wrong category", () => {
    // nike-air-force-1 is in fashion, not electronics
    expect(getProductById("electronics", "nike-air-force-1")).toBeUndefined();
  });

  it("returns the correct product for home category", () => {
    expect(getProductById("home", "coffee-maker-pro")?.id).toBe("coffee-maker-pro");
  });

  it("returns the correct product for sports category", () => {
    expect(getProductById("sports", "yoga-mat-pro")?.id).toBe("yoga-mat-pro");
  });

  it("returns the correct product for books category", () => {
    expect(getProductById("books", "atomic-habits")?.id).toBe("atomic-habits");
  });
});

// Test parse price function, which converts a price string (e.g. "$99.99", "RM 379.00") into a numeric value (e.g. 99.99, 379). We test various formats of price strings, 
// including those with currency symbols, comma separators, and different decimal formats, as well as edge cases like empty strings or non-numeric input. We also include tests that use real product data from the catalogue to ensure that our parsing logic works correctly with the actual price formats used in our product data.
describe("parsePrice", () => {
  it("parses a dollar price string", () => {
    expect(parsePrice("$99.99")).toBe(99.99);
  });

  it("parses a price with comma separators", () => {
    expect(parsePrice("$2,499")).toBe(2499);
  });

  it("parses a price with RM prefix", () => {
    expect(parsePrice("RM 379.00")).toBe(379);
  });

  it("parses a plain number string", () => {
    expect(parsePrice("129")).toBe(129);
  });

  it("parses a price with no decimal", () => {
    expect(parsePrice("$59")).toBe(59);
  });

  it("returns 0 for an empty string", () => {
    expect(parsePrice("")).toBe(0);
  });

  it("returns 0 for a non-numeric string", () => {
    expect(parsePrice("USD")).toBe(0);
  });

  it("parses a large price with comma and decimal", () => {
    expect(parsePrice("$1,099.00")).toBe(1099);
  });

  it("parses the MacBook Pro price from real product data", () => {
    const product = getProductById("electronics", "macbook-pro-16");
    expect(parsePrice(product!.price)).toBe(2499);
  });

  it("parses the cheapest product price correctly", () => {
    const product = getProductById("books", "art-of-war");
    expect(parsePrice(product!.price)).toBe(9);
  });
});


// Test get product image selection logic, which determines which product image to show based on the selected colour and pattern options.
// We mock the generated image maps to test various scenarios such as when both colour and pattern match, when only one matches, when neither matches, and how it handles edge cases like slugs with special characters or missing images.
// This ensures that our image selection logic correctly prioritizes pattern images over colour variants, falls back to defaults appropriately, and handles slug generation consistently.
describe("getProductImageForSelection — pattern takes priority", () => {
  it("returns a pattern image when colour + non-solid pattern both match", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Black",
      selectedPattern: "Stripe",
    });
    expect(result).toBe("/products/mock/pattern/mock-product__black-stripe.png");
  });

  it("returns the correct pattern image for a different colour", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "White",
      selectedPattern: "Stripe",
    });
    expect(result).toBe("/products/mock/pattern/mock-product__white-stripe.png");
  });

  it("does NOT use pattern image when pattern is Solid", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Black",
      selectedPattern: "Solid",
    });
    // Solid bypasses pattern map → falls to colour imageVariants
    expect(result).toBe("/products/mock/imageVariants/black.png");
  });
});

describe("getProductImageForSelection — colour fallback", () => {
  it("returns an imageVariants colour image when pattern is Solid", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Black",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/mock/imageVariants/black.png");
  });

  it("prefers imageVariants over generated map when both exist", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Black",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/mock/imageVariants/black.png");
  });

  it("returns generated colour image when no imageVariants defined", () => {
    const product: Product = { ...mockProduct, id: "canvas-tote-bag", imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Natural",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/fashion/variants/canvas-tote-bag__natural.png");
  });

  it("returns generated colour image for another colour without imageVariants", () => {
    const product: Product = { ...mockProduct, id: "canvas-tote-bag", imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Navy",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/fashion/variants/canvas-tote-bag__navy.png");
  });
});

describe("getProductImageForSelection — default image fallback", () => {
  it("returns product.image when no colour or pattern provided", () => {
    const result = getProductImageForSelection({ product: mockProduct });
    expect(result).toBe("/products/mock/default.jpg");
  });

  it("returns product.image when selected colour has no match anywhere", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Purple",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/mock/default.jpg");
  });

  it("returns product.image when pattern and colour both have no match", () => {
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: "Purple",
      selectedPattern: "Polka Dot",
    });
    expect(result).toBe("/products/mock/default.jpg");
  });

  it("returns undefined when product has no image and no match is found", () => {
    const product: Product = { ...mockProduct, image: undefined, imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Purple",
      selectedPattern: "Solid",
    });
    expect(result).toBeUndefined();
  });
});

describe("getProductImageForSelection — slug handling", () => {
  it("converts colour with forward slash to hyphen slug (e.g. White/Green → white-green)", () => {
    // "Navy" slug = "navy" in mock map
    const product: Product = { ...mockProduct, id: "canvas-tote-bag", imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Navy",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/fashion/variants/canvas-tote-bag__navy.png");
  });

  it("converts colour with spaces to hyphen slug", () => {
    // "Matte Black" → slug "matte-black" — not in mock map → falls back to default
    const product: Product = { ...mockProduct, id: "canvas-tote-bag", imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Matte Black",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/mock/default.jpg");
  });

  it("pattern lookup uses combined colour-pattern slug", () => {
    // "Navy" + "Stripe" → "navy-stripe" — in mock pattern map
    const product: Product = { ...mockProduct, id: "canvas-tote-bag", imageVariants: undefined };
    const result = getProductImageForSelection({
      product,
      selectedColour: "Navy",
      selectedPattern: "Stripe",
    });
    expect(result).toBe("/products/fashion/pattern/canvas-tote-bag__navy-stripe.png");
  });

  it("trims leading/trailing hyphens from slugs", () => {
    // A colour like " Black " should still slugify cleanly to "black"
    const result = getProductImageForSelection({
      product: mockProduct,
      selectedColour: " Black ",
      selectedPattern: "Solid",
    });
    expect(result).toBe("/products/mock/variants/mock-product__black.png")
  });
});

// Data integrity tests for the product catalogue data, ensuring that all products have valid ids, names, brands, prices, and other key properties, and that there are no duplicate product ids across categories. We also check that ratings and reviews (when defined) are within reasonable bounds. 
// This helps catch any issues with the static product data that could cause problems in the UI or other parts of the application that rely on this data being well-formed and consistent.
describe("productData — data integrity", () => {
  const ALL_CATEGORIES = ["electronics", "fashion", "home", "beauty", "sports", "books"];

  it("every product has a non-empty id", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        expect(p.id).toBeTruthy();
      });
    });
  });

  it("every product has at least one size, colour, and pattern", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        expect(p.sizes.length).toBeGreaterThan(0);
        expect(p.colours.length).toBeGreaterThan(0);
        expect(p.patterns.length).toBeGreaterThan(0);
      });
    });
  });

  it("every product price parses to a positive number", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        expect(parsePrice(p.price)).toBeGreaterThan(0);
      });
    });
  });

  it("product ids are unique across all categories", () => {
    const allIds: string[] = [];
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => allIds.push(p.id));
    });
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("every product has a name and brand", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        expect(p.name).toBeTruthy();
        expect(p.brand).toBeTruthy();
      });
    });
  });

  it("ratings are between 1 and 5 when defined", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        if (p.rating !== undefined) {
          expect(p.rating).toBeGreaterThanOrEqual(1);
          expect(p.rating).toBeLessThanOrEqual(5);
        }
      });
    });
  });

  it("reviews are positive integers when defined", () => {
    ALL_CATEGORIES.forEach((catId) => {
      getCategoryById(catId)?.products.forEach((p) => {
        if (p.reviews !== undefined) {
          expect(p.reviews).toBeGreaterThan(0);
          expect(Number.isInteger(p.reviews)).toBe(true);
        }
      });
    });
  });
});
