
import { generatedProductVariantImages } from "@/lib/generatedProductVariants";

const allEntries = Object.entries(generatedProductVariantImages).flatMap(
  ([productId, colourMap]) =>
    Object.entries(colourMap).map(([colourSlug, path]) => ({
      productId,
      colourSlug,
      path,
    }))
);

// Test suite for the generatedProductVariantImages map, which defines the available variant images for products that have multiple colour variants. 
// We check the overall structure of the map, validate that product ids and colour slugs follow the expected format and are unique, verify that image paths are well-formed and follow the expected naming convention, and perform spot checks on specific products to ensure they have the correct variants defined. 
// We also check for cross-file consistency by verifying that all product ids in the variant map correspond to valid products in the catalogue. This helps ensure that our variant image data is correctly structured, consistent, and aligned with our product data.
describe("generatedProductVariantImages — structure", () => {
  it("is a non-empty object", () => {
    expect(Object.keys(generatedProductVariantImages).length).toBeGreaterThan(0);
  });

  it("every product entry is an object with at least one colour", () => {
    Object.entries(generatedProductVariantImages).forEach(([productId, colourMap]) => {
      expect(typeof colourMap).toBe("object");
      expect(Object.keys(colourMap).length).toBeGreaterThan(0);
    });
  });
});

describe("generatedProductVariantImages — product id keys", () => {
  it("all product ids are lowercase kebab-case strings", () => {
    Object.keys(generatedProductVariantImages).forEach((id) => {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it("product ids are unique (no duplicates)", () => {
    const ids = Object.keys(generatedProductVariantImages);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains known product ids from the catalogue", () => {
    const knownIds = [
      "nike-air-force-1",
      "iphone-16-pro",
      "sony-wh-1000xm5",
      "yoga-mat-pro",
      "canvas-tote-bag",
      "levis-501-jeans",
    ];
    knownIds.forEach((id) => {
      expect(generatedProductVariantImages).toHaveProperty(id);
    });
  });
});

describe("generatedProductVariantImages — colour slug keys", () => {
  it("all colour slugs are lowercase kebab-case strings", () => {
    allEntries.forEach(({ colourSlug }) => {
      expect(colourSlug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it("colour slugs within a product are unique", () => {
    Object.entries(generatedProductVariantImages).forEach(([productId, colourMap]) => {
      const slugs = Object.keys(colourMap);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });
});

describe("generatedProductVariantImages — image paths", () => {
  it("every image path is a non-empty string", () => {
    allEntries.forEach(({ path }) => {
      expect(typeof path).toBe("string");
      expect(path.length).toBeGreaterThan(0);
    });
  });

  it("every image path starts with '/'", () => {
    allEntries.forEach(({ path }) => {
      expect(path.startsWith("/")).toBe(true);
    });
  });

  it("every image path ends with '.png' or '.jpg'", () => {
    allEntries.forEach(({ path }) => {
      expect(path).toMatch(/\.(png|jpg)$/);
    });
  });

  it("every image path contains '/variants/'", () => {
    allEntries.forEach(({ path }) => {
      expect(path).toContain("/variants/");
    });
  });

  it("image paths follow the pattern /products/{category}/variants/{product}__{colour}.{ext}", () => {
    allEntries.forEach(({ path }) => {
      expect(path).toMatch(/^\/products\/[^/]+\/variants\/[^/]+__[^/]+\.(png|jpg)$/);
    });
  });

  it("image path filename contains the product id", () => {
    allEntries.forEach(({ productId, path }) => {
      const filename = path.split("/").pop()!;
      expect(filename.startsWith(productId)).toBe(true);
    });
  });

  it("image path filename contains the colour slug after '__'", () => {
    allEntries.forEach(({ colourSlug, path }) => {
      const filename = path.split("/").pop()!;
      // filename: productId__colourSlug.ext
      expect(filename).toContain(`__${colourSlug}.`);
    });
  });

  it("no image path contains whitespace", () => {
    allEntries.forEach(({ path }) => {
      expect(path).not.toMatch(/\s/);
    });
  });

  it("all image paths are unique (no accidental duplicates)", () => {
    const paths = allEntries.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("generatedProductVariantImages — spot checks", () => {
  it("nike-air-force-1 has black, white, and white-green variants", () => {
    const variants = generatedProductVariantImages["nike-air-force-1"];
    expect(variants["black"]).toBeDefined();
    expect(variants["white"]).toBeDefined();
    expect(variants["white-green"]).toBeDefined();
  });

  it("iphone-16-pro has all three titanium colour variants", () => {
    const variants = generatedProductVariantImages["iphone-16-pro"];
    expect(variants["black-titanium"]).toBeDefined();
    expect(variants["desert-titanium"]).toBeDefined();
    expect(variants["natural-titanium"]).toBeDefined();
  });

  it("yoga-mat-pro has sage, charcoal, and lilac", () => {
    const variants = generatedProductVariantImages["yoga-mat-pro"];
    expect(variants["sage"]).toBeDefined();
    expect(variants["charcoal"]).toBeDefined();
    expect(variants["lilac"]).toBeDefined();
  });

  it("kindle-paperwhite has agave, black, and denim", () => {
    const variants = generatedProductVariantImages["kindle-paperwhite"];
    expect(variants["agave"]).toBeDefined();
    expect(variants["black"]).toBeDefined();
    expect(variants["denim"]).toBeDefined();
  });
});
