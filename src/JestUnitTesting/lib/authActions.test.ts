// authActions.test.ts

import { logout } from "@/lib/authActions";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSignOut = jest.fn();
const mockRevalidatePath = jest.fn();
const mockRedirect = jest.fn();
const mockHeaders = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({ auth: { signOut: mockSignOut } })
  ),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupHeaders(referer: string) {
  mockHeaders.mockResolvedValue({
    get: (key: string) => (key === "referer" ? referer : null),
  });
}

//  Tests
beforeEach(() => jest.clearAllMocks());

//  Test for logout function in authActions, which handles signing the user out and redirecting them based on the referer header. We mock the necessary dependencies (e.g. supabase auth, next/navigation, next/headers) to isolate the behavior of the logout function and assert that it correctly calls the signOut method, revalidates the root layout path, and redirects to the homepage when appropriate based on the referer header value. We also test edge cases such as a null referer or a referer that already points to the homepage to ensure that the function behaves correctly in those scenarios as well.
describe("logout", () => {
  it("calls supabase.auth.signOut()", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("/some/page");
    await logout();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("revalidates the root layout path", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("/some/page");
    await logout();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("redirects to '/' when referer is NOT the homepage", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("http://localhost:3000/product/electronics/iphone");
    await logout();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("does NOT redirect when referer ends with '/' (already on homepage)", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("http://localhost:3000/");
    await logout();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects when referer is an empty string", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("");
    await logout();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects when referer is a deep nested product path", async () => {
    mockSignOut.mockResolvedValue({});
    setupHeaders("http://localhost:3000/category/fashion/nike-air-force-1");
    await logout();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("reads the 'referer' header key specifically", async () => {
    mockSignOut.mockResolvedValue({});
    const mockGet = jest.fn((key: string) => (key === "referer" ? "/cart" : null));
    mockHeaders.mockResolvedValue({ get: mockGet });
    await logout();
    expect(mockGet).toHaveBeenCalledWith("referer");
  });

  it("handles a null referer (header not present) by redirecting", async () => {
    mockSignOut.mockResolvedValue({});
    mockHeaders.mockResolvedValue({ get: () => null });
    await logout();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
