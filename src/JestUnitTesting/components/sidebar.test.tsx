import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/sidebar";
import { logout } from "@/lib/authActions";

// Mocks for navigation and data fetching used by Sidebar
jest.mock("@/lib/authActions", () => ({
  logout: jest.fn(),
}));

const mockLogout = logout as jest.MockedFunction<typeof logout>;

// Helper function to render the Sidebar component with default props, allowing tests to easily override specific props (e.g. userName, userEmail) as needed for different test scenarios without having to repeat the full render logic in each test case. This keeps the tests concise and focused on the relevant attributes for each test case while still providing a complete set of props that matches the expected shape used by the Sidebar component.
function renderSidebar(
  props: Partial<React.ComponentProps<typeof Sidebar>> = {}
) {
  return render(<Sidebar {...props} />);
}


beforeEach(() => jest.clearAllMocks());

// Tests for Sidebar component
describe("Sidebar — branding & structure", () => {
  it("renders the ShopKL Admin brand name when open", () => {
    renderSidebar();
    expect(screen.getByText(/shopkl admin/i)).toBeInTheDocument();
  });

  it("renders all 3 nav items", () => {
    renderSidebar();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Server Monitor")).toBeInTheDocument();
  });

  it("nav items have correct href anchors", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /products/i })).toHaveAttribute(
      "href",
      "#manage-products"
    );
    expect(screen.getByRole("link", { name: /orders/i })).toHaveAttribute(
      "href",
      "#manage-orders"
    );
    expect(screen.getByRole("link", { name: /server monitor/i })).toHaveAttribute(
      "href",
      "#server-monitor"
    );
  });
});

describe("Sidebar — profile card", () => {
  it("displays the user name when open", () => {
    renderSidebar({ userName: "Alice Smith" });
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("displays the user email when open", () => {
    renderSidebar({ userEmail: "alice@example.com" });
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("shows initials from a two-word name", () => {
    renderSidebar({ userName: "Alice Smith" });
    // Initials "AS" should appear somewhere (avatar)
    expect(screen.getAllByText("AS").length).toBeGreaterThan(0);
  });

  it("shows initials from a single-word name", () => {
    renderSidebar({ userName: "Admin" });
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
  });

  it("caps initials at 2 characters for long names", () => {
    renderSidebar({ userName: "Alice Bob Carol" });
    // Should be "AB", not "ABC"
    expect(screen.queryByText("ABC")).not.toBeInTheDocument();
  });

  it("shows the ADMIN badge when open", () => {
    renderSidebar();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("uses default userName 'Admin' when not provided", () => {
    renderSidebar();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("uses default userEmail when not provided", () => {
    renderSidebar();
    expect(screen.getByText("admin@shopkl.com")).toBeInTheDocument();
  });
});

describe("Sidebar — toggle behaviour", () => {
  it("is open by default", () => {
    renderSidebar();
    // Brand name visible = sidebar is open
    expect(screen.getByText(/shopkl admin/i)).toBeInTheDocument();
  });

  it("hides brand label when toggled closed", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(screen.queryByText(/shopkl admin/i)).not.toBeInTheDocument();
  });

  it("hides nav item labels when closed", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(screen.queryByText("Products")).not.toBeInTheDocument();
    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
  });

  it("hides Logout text label when closed", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    // Check the text label is gone, not the button (icon button with title stays)
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("re-opens when toggled again", async () => {
    renderSidebar();
    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    await userEvent.click(toggleBtn); // close
    await userEvent.click(toggleBtn); // re-open
    expect(screen.getByText(/shopkl admin/i)).toBeInTheDocument();
  });

  it("shows title attribute on nav links when closed (tooltip fallback)", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    // Remove the broken line: screen.getByRole("link", { name: "" }) — empty name won't work
    const allLinks = screen.getAllByRole("link");
    const hasTitles = allLinks.some((link) => link.getAttribute("title"));
    expect(hasTitles).toBe(true);
  });
});

describe("Sidebar — logout", () => {
  it("renders the Logout button when open", () => {
    renderSidebar();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls logout when the Logout button is clicked", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders an icon-only logout button when sidebar is collapsed", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    // The icon logout button should still be present (title="Logout")
    expect(screen.getByTitle("Logout")).toBeInTheDocument();
  });

  it("calls logout when icon-only logout button is clicked (collapsed state)", async () => {
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    await userEvent.click(screen.getByTitle("Logout"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("shows version footer text when open", () => {
    renderSidebar();
    expect(screen.getByText(/admin v1\.0/i)).toBeInTheDocument();
  });
});
