import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./ProtectedRoute";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(ui: React.ReactElement, initialRoute = "/") {
  return render(<MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>);
}

describe("ProtectedRoute", () => {
  it("shows loading skeleton while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false });
    const { container } = renderWithRouter(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    mockUseAuth.mockReturnValue({ user: { id: "123" }, loading: false, isAdmin: false });
    renderWithRouter(<ProtectedRoute><p>Secret content</p></ProtectedRoute>);
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    renderWithRouter(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("shows loading skeleton while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false });
    const { container } = renderWithRouter(<AdminRoute><p>Admin</p></AdminRoute>);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders children for admin users", () => {
    mockUseAuth.mockReturnValue({ user: { id: "123" }, loading: false, isAdmin: true });
    renderWithRouter(<AdminRoute><p>Admin panel</p></AdminRoute>);
    expect(screen.getByText("Admin panel")).toBeInTheDocument();
  });

  it("redirects non-admin authenticated users", () => {
    mockUseAuth.mockReturnValue({ user: { id: "123" }, loading: false, isAdmin: false });
    renderWithRouter(<AdminRoute><p>Admin</p></AdminRoute>);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    renderWithRouter(<AdminRoute><p>Admin</p></AdminRoute>);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});
