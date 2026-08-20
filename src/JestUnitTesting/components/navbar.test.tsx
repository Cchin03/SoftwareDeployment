import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "@/components/navbar";
import { logout } from "@/lib/authActions";

// Mocks for navigation and data fetching used by Navbar
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/lib/authActions", () => ({
  logout: jest.fn(),
}));

// Mutable mock for onCartClick so we can assert on it in the interactions tests
const mockOnCartClick = jest.fn();

// Navbar has no `isGuest` prop — guest status is derived internally from
// `user` (`const isGuest = !user`). Authenticated rendering also depends on
// `user.name` / `user.email`, so tests need a real user object rather than a
// boolean flag.
const authUser = { name: "Alice", email: "alice@example.com" };

function renderNavbar(
  overrides: Partial<React.ComponentProps<typeof Navbar>> = {}
) {
  return render(
    <Navbar
      user={authUser}
      cartCount={0}
      onCartClick={mockOnCartClick}
      {...overrides}
    />
  );
}

beforeEach(() => jest.clearAllMocks());

// Tests for Navbar component
describe("Navbar — branding & structure", () => {
  it("renders the shop.io logo", () => {
    renderNavbar();
    expect(screen.getByText(/shop/i)).toBeInTheDocument();
  });

  it("does not render the logo when showLogo is false", () => {
    renderNavbar({ showLogo: false });
    expect(screen.queryByText(/shop/i)).not.toBeInTheDocument();
  });

  it("renders a link to the home page", () => {
    renderNavbar();
    // Use getAllByRole and check at least one points to "/"
    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    const homeNavLink = homeLinks.find((l) => l.getAttribute("href") === "/");
    expect(homeNavLink).toBeInTheDocument();
  });

  it("renders all 4 category nav links", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: /electronics/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fashion/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home & living/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /beauty/i })).toBeInTheDocument();
  });

  it("each category link points to the correct /category/:id route", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: /electronics/i })).toHaveAttribute(
      "href",
      "/category/electronics"
    );
    expect(screen.getByRole("link", { name: /beauty/i })).toHaveAttribute(
      "href",
      "/category/beauty"
    );
  });

  it("does not render nav links when showNavLinks is false", () => {
    renderNavbar({ showNavLinks: false });
    expect(screen.queryByRole("link", { name: /electronics/i })).not.toBeInTheDocument();
  });
});

describe("Navbar — guest state (user is null)", () => {
  it("shows Sign in link when user is null", () => {
    renderNavbar({ user: null });
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows Get started link when user is null", () => {
    renderNavbar({ user: null });
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("does NOT show Logout button when user is null", () => {
    renderNavbar({ user: null });
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
  });

  it("cart link points to '#' for guest users", () => {
    renderNavbar({ user: null });
    const cartLink = screen.getByTitle(/sign in to access cart/i);
    expect(cartLink).toHaveAttribute("href", "#");
  });

  it("shows lock emoji on cart for guest users", () => {
    renderNavbar({ user: null });
    expect(screen.getByText("🔒")).toBeInTheDocument();
  });
});

describe("Navbar — authenticated state", () => {
  it("shows Logout button when user is present", () => {
    renderNavbar({ user: authUser });
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("does NOT show Sign in link when authenticated", () => {
    renderNavbar({ user: authUser });
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("does NOT show Get started link when authenticated", () => {
    renderNavbar({ user: authUser });
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("cart link points to /cart for authenticated users", () => {
    renderNavbar({ user: authUser });
    const cartLink = screen.getByTitle(/^cart$/i);
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  it("does NOT show lock emoji when authenticated", () => {
    renderNavbar({ user: authUser });
    expect(screen.queryByText("🔒")).not.toBeInTheDocument();
  });

  it("displays the user's name", () => {
    renderNavbar({ user: authUser });
    expect(screen.getByText(authUser.name)).toBeInTheDocument();
  });

  it("displays the first letter of the user's name as the avatar initial", () => {
    renderNavbar({ user: authUser });
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("Navbar — cart badge", () => {
  it("does NOT show badge when cartCount is 0", () => {
    renderNavbar({ cartCount: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows badge with correct count", () => {
    renderNavbar({ cartCount: 5 });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows '99+' when cartCount exceeds 99", () => {
    renderNavbar({ cartCount: 100 });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows '99+' at exactly 100", () => {
    renderNavbar({ cartCount: 100 });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows exact count at 99", () => {
    renderNavbar({ cartCount: 99 });
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("does not render the cart icon at all when showCart is false", () => {
    renderNavbar({ showCart: false, cartCount: 5 });
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });
});

describe("Navbar — interactions", () => {
  it("calls onCartClick when cart icon is clicked", async () => {
    renderNavbar({ user: authUser, cartCount: 3 });
    const cartLink = screen.getByTitle(/^cart$/i);
    await userEvent.click(cartLink);
    expect(mockOnCartClick).toHaveBeenCalledTimes(1);
  });

  it("logout button is inside a form with the logout action", () => {
    renderNavbar({ user: authUser });
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    const form = logoutBtn.closest("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("action");
  });
}); 