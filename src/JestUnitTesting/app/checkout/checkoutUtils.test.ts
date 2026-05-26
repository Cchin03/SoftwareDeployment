/**
 * What we test:
 *  validatePhone  – all country-specific rules + generic fallback
 *  sanitizeText   – allowed vs blocked characters
 *  sanitizePhoneDisplay – strips non-digits
 */


// Validation function for phone number input. It checks the country code and applies specific digit length rules for certain countries, while falling back to a generic 7–15 digit rule for unknown country codes. It also strips out non-digit characters before counting digits, so users can enter numbers with spaces or hyphens for readability without causing validation to fail.
function validatePhone(countryCode: string, number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "Phone number is required.";

  const rules: Record<string, { min: number; max: number }> = {
    "+60":  { min: 9,  max: 10 },
    "+65":  { min: 8,  max: 8  },
    "+62":  { min: 9,  max: 12 },
    "+66":  { min: 9,  max: 9  },
    "+63":  { min: 10, max: 10 },
    "+84":  { min: 9,  max: 10 },
    "+1":   { min: 10, max: 10 },
    "+44":  { min: 10, max: 10 },
    "+91":  { min: 10, max: 10 },
  };

  const rule = rules[countryCode];
  if (rule) {
    if (digits.length < rule.min || digits.length > rule.max) {
      return `Enter ${rule.min === rule.max ? rule.min : `${rule.min}–${rule.max}`} digits for ${countryCode}.`;
    }
  } else {
    if (digits.length < 7 || digits.length > 15) {
      return "Enter a valid phone number (7–15 digits).";
    }
  }
  return null;
}

// Sanitize text input by stripping out any characters that aren't letters, digits, spaces, or basic punctuation. This is used to prevent users from entering weird or potentially harmful characters in fields like name and address. We allow Unicode letters (including accented characters common in Malay and Chinese) by using \u00C0-\u024F for Latin Extended and \u4E00-\u9FFF for CJK Unified Ideographs.
function sanitizeText(value: string): string {
  return value.replace(/[^a-zA-Z0-9\u00C0-\u024F\u4E00-\u9FFF\s\-'.,/]/g, "");
}

// For display purposes only: strip all non-digit characters so the phone number is just a string of digits. This is not used for validation or storage, just to ensure that when we show the number back to the user (e.g. in the order confirmation) it doesn't have any weird characters that were entered by mistake.
function sanitizePhoneDisplay(value: string): string {
  return value.replace(/[^0-9]/g, "");
}


describe("validatePhone", () => {
  // empty input 
  test("returns error when number is empty string", () => {
    expect(validatePhone("+60", "")).toBe("Phone number is required.");
  });

  test("returns error when number contains only non-digit characters", () => {
    expect(validatePhone("+60", "---")).toBe("Phone number is required.");
  });

  // Malaysia (+60): 9–10 digits
  test("+60: accepts 9-digit number", () => {
    expect(validatePhone("+60", "123456789")).toBeNull();
  });

  test("+60: accepts 10-digit number", () => {
    expect(validatePhone("+60", "1234567890")).toBeNull();
  });

  test("+60: rejects 8-digit number", () => {
    expect(validatePhone("+60", "12345678")).toContain("+60");
  });

  test("+60: rejects 11-digit number", () => {
    expect(validatePhone("+60", "12345678901")).toContain("+60");
  });

  // Singapore (+65): exactly 8 digits 
  test("+65: accepts exactly 8 digits", () => {
    expect(validatePhone("+65", "12345678")).toBeNull();
  });

  test("+65: rejects 7 digits", () => {
    expect(validatePhone("+65", "1234567")).not.toBeNull();
  });

  test("+65: rejects 9 digits", () => {
    expect(validatePhone("+65", "123456789")).not.toBeNull();
  });

  // US (+1): exactly 10 digits 
  test("+1: accepts 10 digits", () => {
    expect(validatePhone("+1", "1234567890")).toBeNull();
  });

  test("+1: rejects 9 digits", () => {
    expect(validatePhone("+1", "123456789")).not.toBeNull();
  });

  // Generic fallback: 7–15 digits 
  test("generic: accepts 7-digit number for unknown country code", () => {
    expect(validatePhone("+999", "1234567")).toBeNull();
  });

  test("generic: accepts 15-digit number for unknown country code", () => {
    expect(validatePhone("+999", "123456789012345")).toBeNull();
  });

  test("generic: rejects 6-digit number for unknown country code", () => {
    expect(validatePhone("+999", "123456")).toBe("Enter a valid phone number (7–15 digits).");
  });

  test("generic: rejects 16-digit number for unknown country code", () => {
    expect(validatePhone("+999", "1234567890123456")).toBe("Enter a valid phone number (7–15 digits).");
  });

  // ── strips non-digit characters before validation ────────────────────────
  test("ignores hyphens/spaces when counting digits (+60)", () => {
    expect(validatePhone("+60", "012-345 678")).toBeNull(); // 9 digits
  });
});

describe("sanitizeText", () => {
  test("allows letters, digits, spaces", () => {
    expect(sanitizeText("Hello World 123")).toBe("Hello World 123");
  });

  test("allows hyphen, apostrophe, comma, period, slash", () => {
    expect(sanitizeText("O'Brien, No. 5/A-2")).toBe("O'Brien, No. 5/A-2");
  });

  test("strips @ symbol", () => {
    expect(sanitizeText("user@example")).toBe("userexample");
  });

  test("strips # $ % ^ & * ! ? characters", () => {
    expect(sanitizeText("Hello#$%^&*!?")).toBe("Hello");
  });

  test("preserves Unicode Latin Extended characters (Malay)", () => {
    expect(sanitizeText("Jalan Tún Razak")).toBe("Jalan Tún Razak");
  });

  test("preserves CJK characters (Chinese)", () => {
    expect(sanitizeText("吉隆坡")).toBe("吉隆坡");
  });

  test("returns empty string for input with only blocked characters", () => {
    expect(sanitizeText("@#$!")).toBe("");
  });
});

describe("sanitizePhoneDisplay", () => {
  test("keeps digits only", () => {
    expect(sanitizePhoneDisplay("012-345 6789")).toBe("0123456789");
  });

  test("strips letters", () => {
    expect(sanitizePhoneDisplay("abc123")).toBe("123");
  });

  test("strips parentheses and plus sign", () => {
    expect(sanitizePhoneDisplay("+60(12)3456789")).toBe("60123456789");
  });

  test("returns empty string for all non-digit input", () => {
    expect(sanitizePhoneDisplay("---")).toBe("");
  });

  test("passes through pure digit string unchanged", () => {
    expect(sanitizePhoneDisplay("1234567890")).toBe("1234567890");
  });
});
