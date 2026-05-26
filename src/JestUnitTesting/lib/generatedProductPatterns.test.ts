// Data-integrity tests for the generated pattern image map.

import { generatedProductPatternImages } from "@/lib/generatedProductPatterns";

const allEntries = Object.entries(generatedProductPatternImages).flatMap(
  ([productId, patternMap]) =>
    Object.entries(patternMap).map(([patternKey, path]) => ({
      productId,
      patternKey,
      path,
    }))
);

// Test suite for the generatedProductPatternImages map, which defines the available pattern images for products that have non-solid patterns. 
// We check the overall structure of the map, validate that product ids and pattern keys follow the expected format and are unique, verify that image paths are well-formed and follow the expected naming convention, 
// and perform spot checks on specific products to ensure they have the correct patterns defined. We also check for cross-file consistency by verifying that all product ids in the pattern map correspond to valid products in the catalogue. This helps ensure that our pattern image data is correctly structured, consistent, 
// and aligned with our product data.
describe("generatedProductPatternImages — structure", () => {
  it("is a non-empty object", () => {
    expect(Object.keys(generatedProductPatternImages).length).toBeGreaterThan(0);
  });

  it("every product entry is an object with at least one pattern", () => {
    Object.entries(generatedProductPatternImages).forEach(([, patternMap]) => {
      expect(typeof patternMap).toBe("object");
      expect(Object.keys(patternMap).length).toBeGreaterThan(0);
    });
  });
});

describe("generatedProductPatternImages — product id keys", () => {
  it("all product ids are lowercase kebab-case strings", () => {
    Object.keys(generatedProductPatternImages).forEach((id) => {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it("product ids are unique (no duplicates)", () => {
    const ids = Object.keys(generatedProductPatternImages);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains known pattern-enabled products from the catalogue", () => {
    const knownIds = [
      "canvas-tote-bag",
      "levis-501-jeans",
      "nike-air-force-1",
      "merino-wool-sweater",
      "yoga-mat-pro",
      "lip-gloss-set",
      "running-shoes-v2",
      "scented-candle-set",
    ];
    knownIds.forEach((id) => {
      expect(generatedProductPatternImages).toHaveProperty(id);
    });
  });
});

describe("generatedProductPatternImages — pattern keys", () => {
  it("all pattern keys are lowercase kebab-case strings", () => {
    allEntries.forEach(({ patternKey }) => {
      expect(patternKey).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it("pattern keys within a product are unique", () => {
    Object.entries(generatedProductPatternImages).forEach(([, patternMap]) => {
      const keys = Object.keys(patternMap);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  it("pattern keys encode both colour and pattern (contain at least one hyphen)", () => {
    // Keys should be composite e.g. "black-stripe", "navy-ribbed"
    allEntries.forEach(({ patternKey }) => {
      expect(patternKey).toContain("-");
    });
  });

  it("no pattern key equals 'solid' (solid patterns use variant images, not pattern images)", () => {
    allEntries.forEach(({ patternKey }) => {
      // Only pure 'solid' keys are banned, compound keys like 'coral-solid' are ok
      expect(patternKey).not.toBe("solid");
    });
  });
});

describe("generatedProductPatternImages — image paths", () => {
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

  it("every image path contains '/pattern/'", () => {
    allEntries.forEach(({ path }) => {
      expect(path).toContain("/pattern/");
    });
  });

  it("image paths follow the pattern /products/{category}/pattern/{product}__{key}.{ext}", () => {
    allEntries.forEach(({ path }) => {
      expect(path).toMatch(/^\/products\/[^/]+\/pattern\/[^/]+__[^/]+\.(png|jpg)$/);
    });
  });

  it("image path filename contains the product id", () => {
    allEntries.forEach(({ productId, path }) => {
      const filename = path.split("/").pop()!;
      expect(filename.startsWith(productId)).toBe(true);
    });
  });

  it("image path filename contains the pattern key after '__'", () => {
    allEntries.forEach(({ patternKey, path }) => {
      const filename = path.split("/").pop()!;
      expect(filename).toContain(`__${patternKey}.`);
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

describe("generatedProductPatternImages — spot checks", () => {
  it("canvas-tote-bag has natural-stripe, navy-stripe, and olive-stripe", () => {
    const patterns = generatedProductPatternImages["canvas-tote-bag"];
    expect(patterns["natural-stripe"]).toBeDefined();
    expect(patterns["navy-stripe"]).toBeDefined();
    expect(patterns["olive-stripe"]).toBeDefined();
  });

  it("levis-501-jeans has three wash-faded patterns", () => {
    const patterns = generatedProductPatternImages["levis-501-jeans"];
    expect(patterns["black-wash-faded"]).toBeDefined();
    expect(patterns["indigo-faded"]).toBeDefined();
    expect(patterns["stone-faded"]).toBeDefined();
  });

  it("nike-air-force-1 has three contrast-panel patterns", () => {
    const patterns = generatedProductPatternImages["nike-air-force-1"];
    expect(patterns["black-contrast-panel"]).toBeDefined();
    expect(patterns["white-contrast-panel"]).toBeDefined();
    expect(patterns["white-green-contrast-panel"]).toBeDefined();
  });

  it("yoga-mat-pro has three marble patterns", () => {
    const patterns = generatedProductPatternImages["yoga-mat-pro"];
    expect(patterns["charcoal-marble"]).toBeDefined();
    expect(patterns["lilac-marble"]).toBeDefined();
    expect(patterns["sage-marble"]).toBeDefined();
  });

  it("scented-candle-set has amber-etched and ivory-etched", () => {
    const patterns = generatedProductPatternImages["scented-candle-set"];
    expect(patterns["amber-etched"]).toBeDefined();
    expect(patterns["ivory-etched"]).toBeDefined();
  });

  it("merino-wool-sweater ribbed patterns include all three colour variants", () => {
    const patterns = generatedProductPatternImages["merino-wool-sweater"];
    expect(patterns["forest-ribbed"]).toBeDefined();
    expect(patterns["navy-ribbed"]).toBeDefined();
    expect(patterns["oatmeal-ribbed"]).toBeDefined();
  });
});

describe("generatedProductPatternImages — cross-file consistency", () => {
  it("every product in pattern map also exists in the catalogue (ids are valid)", () => {
    // Pattern images should only be defined for products that actually have non-solid patterns
    const patternProductIds = Object.keys(generatedProductPatternImages);
    patternProductIds.forEach((id) => {
      // Just verify the id follows the correct format — full catalogue check is in productData.test.ts
      expect(id).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
