import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";

// Track mock implementations
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockProfileSelect = vi.fn();
const mockRolesSelect = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockProfileSelect(),
            }),
          }),
        };
      }
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => mockRolesSelect(),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) };
    },
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({ data: { name: "Test" }, error: null });
    mockRolesSelect.mockResolvedValue({ data: [], error: null });
  });

  it("starts with loading true", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
  });

  it("provides default values before session loads", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("resolves loading to false after getSession", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles getSession error gracefully", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Session error" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it("handles getSession rejection gracefully", async () => {
    mockGetSession.mockRejectedValue(new Error("Network failure"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it("sets user and session when session exists", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@test.com" },
      access_token: "token",
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.user).toEqual(mockSession.user);
    });
  });

  it("detects admin role from user_roles", async () => {
    const mockSession = {
      user: { id: "admin-1", email: "admin@test.com" },
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockRolesSelect.mockResolvedValue({
      data: [{ role: "admin" }],
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it("non-admin user has isAdmin false", async () => {
    const mockSession = {
      user: { id: "user-1", email: "user@test.com" },
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockRolesSelect.mockResolvedValue({
      data: [{ role: "user" }],
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  it("handles profile fetch error gracefully", async () => {
    const mockSession = {
      user: { id: "user-1", email: "test@test.com" },
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockProfileSelect.mockResolvedValue({
      data: null,
      error: { message: "Profile not found" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Should not crash, profile should be null
    expect(result.current.profile).toBeNull();

    consoleSpy.mockRestore();
  });

  it("signOut clears all state", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const mockSession = {
      user: { id: "user-1", email: "test@test.com" },
    };
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("signOut handles error gracefully", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "Sign out error" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    // Should still clear state even on error
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);

    consoleSpy.mockRestore();
  });

  it("unsubscribes from auth listener on unmount", () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
