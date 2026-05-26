import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mutable mock for logout so we can assert on it in the interactions tests
const mockOnCartClick = jest.fn();

function renderNavbar(
  overrides: Partial<React.ComponentProps<typeof Navbar>> = {}
) {
  return render(
    <Navbar
      isGuest={false}
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

  it("renders a link to the home page", () => {
    renderNavbar();
    // Use getAllByRole and check at least one points to "/"
    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    const homeNavLink = homeLinks.find(l => l.getAttribute("href") === "/");
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
});

describe("Navbar — guest state", () => {
  it("shows Sign in link when isGuest is true", () => {
    renderNavbar({ isGuest: true });
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows Get started link when isGuest is true", () => {
    renderNavbar({ isGuest: true });
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("does NOT show Logout button when isGuest is true", () => {
    renderNavbar({ isGuest: true });
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
  });

  it("cart link points to '#' for guest users", () => {
    renderNavbar({ isGuest: true });
    const cartLink = screen.getByTitle(/sign in to access cart/i);
    expect(cartLink).toHaveAttribute("href", "#");
  });

  it("shows lock emoji on cart for guest users", () => {
    renderNavbar({ isGuest: true });
    expect(screen.getByText("🔒")).toBeInTheDocument();
  });
});

describe("Navbar — authenticated state", () => {
  it("shows Logout button when isGuest is false", () => {
    renderNavbar({ isGuest: false });
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("does NOT show Sign in link when authenticated", () => {
    renderNavbar({ isGuest: false });
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("does NOT show Get started link when authenticated", () => {
    renderNavbar({ isGuest: false });
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("cart link points to /cart for authenticated users", () => {
    renderNavbar({ isGuest: false });
    const cartLink = screen.getByTitle(/cart/i);
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  it("does NOT show lock emoji when authenticated", () => {
    renderNavbar({ isGuest: false });
    expect(screen.queryByText("🔒")).not.toBeInTheDocument();
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
});

describe("Navbar — interactions", () => {
  it("calls onCartClick when cart icon is clicked", async () => {
    renderNavbar({ isGuest: false, cartCount: 3 });
    const cartLink = screen.getByTitle(/cart/i);
    await userEvent.click(cartLink);
    expect(mockOnCartClick).toHaveBeenCalledTimes(1);
  });

  it("logout button is inside a form with the logout action", () => {
    renderNavbar({ isGuest: false });
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    expect(logoutBtn.closest("form")).toBeInTheDocument();
  });
});
