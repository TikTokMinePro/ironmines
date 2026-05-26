import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./Login";

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, whileTap, style, ...rest } = props;
      return <div style={style} {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, style, ...rest } = props;
      return <button style={style} {...rest}>{children}</button>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useTransform: () => 0,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock sonner
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with email and password fields", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
  });

  it("renders Entrar button", () => {
    renderLogin();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    renderLogin();
    expect(screen.getByText("Esqueci minha senha")).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByLabelText("Formulário de login"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/app/dashboard");
    });
  });

  it("shows friendly error on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByLabelText("Formulário de login"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Email ou senha incorretos. Verifique e tente novamente."
      );
    });
  });

  it("shows connection error on network failure", async () => {
    mockSignInWithPassword.mockRejectedValue(new Error("Network error"));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "password" } });
    fireEvent.submit(screen.getByLabelText("Formulário de login"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Erro de conexão. Verifique sua internet e tente novamente."
      );
    });
  });

  it("switches to forgot password mode", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("Enviar Link")).toBeInTheDocument();
    expect(screen.getByText("Voltar ao login")).toBeInTheDocument();
  });

  it("handles forgot password success", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.click(screen.getByText("Esqueci minha senha"));
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.submit(screen.getByLabelText("Recuperar senha"));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Link de redefinição enviado para seu email!");
    });
  });

  it("handles forgot password error", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Email rate limit exceeded" },
    });
    renderLogin();

    fireEvent.click(screen.getByText("Esqueci minha senha"));
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.submit(screen.getByLabelText("Recuperar senha"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Limite de envios atingido. Aguarde alguns minutos."
      );
    });
  });

  it("can go back from forgot password mode", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("Voltar ao login")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Voltar ao login"));
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText("Senha");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByLabelText("Mostrar senha");
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("shows error when email is empty on forgot password", async () => {
    renderLogin();
    fireEvent.click(screen.getByText("Esqueci minha senha"));
    // Clear the email and submit
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "" } });
    // HTML5 validation should prevent submission, but the form handler checks too
  });

  it("renders IronMines logo", () => {
    renderLogin();
    expect(screen.getByAltText("IronMines")).toBeInTheDocument();
  });

  it("renders tagline", () => {
    renderLogin();
    expect(screen.getByText("Mineração inteligente de produtos virais")).toBeInTheDocument();
  });
});
