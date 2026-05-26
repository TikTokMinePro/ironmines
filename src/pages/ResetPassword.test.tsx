import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordPage from "./ResetPassword";

// Mock supabase
const mockUpdateUser = vi.fn();
const unsubscribeFn = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      updateUser: (data: any) => mockUpdateUser(data),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: unsubscribeFn } },
      }),
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
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderReset(hash = "") {
  // Set window.location.hash
  Object.defineProperty(window, "location", {
    value: { ...window.location, hash, origin: "http://localhost" },
    writable: true,
  });
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo and title", () => {
    renderReset();
    expect(screen.getByAltText("IronMines")).toBeInTheDocument();
    expect(screen.getByText("Redefinir Senha")).toBeInTheDocument();
  });

  it("shows waiting message when not ready", () => {
    renderReset();
    expect(screen.getByText("Aguardando validação do link...")).toBeInTheDocument();
  });

  it("shows form when type=recovery is in hash", () => {
    renderReset("#type=recovery");
    expect(screen.getByPlaceholderText("Mínimo 6 caracteres")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repita a senha")).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    renderReset("#type=recovery");
    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "password1" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "password2" } });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("As senhas não coincidem");
    });
  });

  it("validates password too short", async () => {
    renderReset("#type=recovery");
    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("A senha deve ter pelo menos 6 caracteres");
    });
  });

  it("handles successful password reset", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    renderReset("#type=recovery");

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Senha redefinida com sucesso!");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows friendly error for same password", async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: "same password" } });
    renderReset("#type=recovery");

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "samepass" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "samepass" } });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("A nova senha deve ser diferente da senha atual.");
    });
  });

  it("handles network error gracefully", async () => {
    mockUpdateUser.mockRejectedValue(new Error("Network error"));
    renderReset("#type=recovery");

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByPlaceholderText("Repita a senha"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Erro de conexão. Verifique sua internet e tente novamente.");
    });
  });

  it("shows fallback message for expired link", () => {
    renderReset();
    expect(screen.getByText("Se o link não carregar, tente clicar novamente no email.")).toBeInTheDocument();
  });
});
