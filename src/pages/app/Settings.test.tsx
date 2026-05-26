import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./Settings";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock supabase
const mockUpdate = vi.fn();
const mockUpdateUser = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: (data: any) => ({
        eq: () => mockUpdate(data),
      }),
    }),
    auth: {
      updateUser: (data: any) => mockUpdateUser(data),
    },
  },
}));

// Mock sonner
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      profile: { name: "João Silva", subscription_status: "active", subscription_expires_at: "2026-12-31" },
      user: { id: "user-123", email: "joao@test.com" },
      isAdmin: false,
      signOut: vi.fn(),
    });
  });

  it("renders settings heading", () => {
    renderSettings();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("renders profile section with name and email", () => {
    renderSettings();
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("joao@test.com")).toBeInTheDocument();
  });

  it("validates empty name on save", async () => {
    renderSettings();
    const nameInput = screen.getByDisplayValue("João Silva");
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("O nome não pode estar vazio");
    });
  });

  it("saves profile successfully", async () => {
    mockUpdate.mockResolvedValue({ error: null });
    renderSettings();

    fireEvent.change(screen.getByDisplayValue("João Silva"), { target: { value: "João Updated" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Perfil atualizado!");
    });
  });

  it("shows error when profile save fails", async () => {
    mockUpdate.mockResolvedValue({ error: { message: "DB error" } });
    renderSettings();

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Erro ao salvar perfil. Tente novamente.");
    });
  });

  it("validates short password", async () => {
    renderSettings();
    const passwordInput = screen.getByPlaceholderText("Mínimo 6 caracteres");
    fireEvent.change(passwordInput, { target: { value: "123" } });
    const buttons = screen.getAllByText("Alterar Senha");
    fireEvent.click(buttons[buttons.length - 1]); // click the button, not the heading

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("A senha deve ter pelo menos 6 caracteres");
    });
  });

  it("changes password successfully", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    renderSettings();

    const passwordInput = screen.getByPlaceholderText("Mínimo 6 caracteres");
    fireEvent.change(passwordInput, { target: { value: "newpass123" } });
    const buttons = screen.getAllByText("Alterar Senha");
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Senha alterada com sucesso!");
    });
  });

  it("shows subscription info for regular user", () => {
    renderSettings();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("31/12/2026")).toBeInTheDocument();
  });

  it("shows admin badge for admin user", () => {
    mockUseAuth.mockReturnValue({
      profile: { name: "Admin", subscription_status: "active" },
      user: { id: "admin-1", email: "admin@test.com" },
      isAdmin: true,
      signOut: vi.fn(),
    });
    renderSettings();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Acesso total ao sistema sem restrições.")).toBeInTheDocument();
  });

  it("renders sign out button", () => {
    renderSettings();
    expect(screen.getByText("Sair da Conta")).toBeInTheDocument();
  });

  it("calls signOut when button is clicked", () => {
    const mockSignOut = vi.fn();
    mockUseAuth.mockReturnValue({
      profile: { name: "Test" },
      user: { id: "u1", email: "t@t.com" },
      isAdmin: false,
      signOut: mockSignOut,
    });
    renderSettings();
    fireEvent.click(screen.getByText("Sair da Conta"));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("shows renew plan link for non-admin users", () => {
    renderSettings();
    expect(screen.getByText("Renovar / Alterar Plano")).toBeInTheDocument();
  });

  it("has maxLength on name input", () => {
    renderSettings();
    const nameInput = screen.getByDisplayValue("João Silva");
    expect(nameInput).toHaveAttribute("maxLength", "100");
  });
});
