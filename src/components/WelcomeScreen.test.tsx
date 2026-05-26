import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeScreen } from "./WelcomeScreen";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock framer-motion to render immediately
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...filterMotionProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterMotionProps(props: Record<string, any>) {
  const motionKeys = ["initial", "animate", "exit", "transition", "variants", "whileHover", "whileTap", "style"];
  const filtered = { ...props };
  motionKeys.forEach(k => delete filtered[k]);
  return filtered;
}

describe("WelcomeScreen", () => {
  const onContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders greeting with user first name", () => {
    mockUseAuth.mockReturnValue({ profile: { name: "João Silva" } });
    render(<WelcomeScreen onContinue={onContinue} />);
    expect(screen.getByText("João")).toBeInTheDocument();
  });

  it("falls back to 'Minerador' when no profile name", () => {
    mockUseAuth.mockReturnValue({ profile: null });
    render(<WelcomeScreen onContinue={onContinue} />);
    expect(screen.getByText("Minerador")).toBeInTheDocument();
  });

  it("falls back to 'Minerador' when name is empty", () => {
    mockUseAuth.mockReturnValue({ profile: { name: "" } });
    render(<WelcomeScreen onContinue={onContinue} />);
    expect(screen.getByText("Minerador")).toBeInTheDocument();
  });

  it("renders all 4 feature cards", () => {
    mockUseAuth.mockReturnValue({ profile: { name: "Test" } });
    render(<WelcomeScreen onContinue={onContinue} />);
    expect(screen.getByText("Produtos Virais")).toBeInTheDocument();
    expect(screen.getByText("Vídeos Virais")).toBeInTheDocument();
    expect(screen.getByText("Criadores")).toBeInTheDocument();
    expect(screen.getByText("Influencer IA")).toBeInTheDocument();
  });

  it("calls onContinue when button is clicked", () => {
    mockUseAuth.mockReturnValue({ profile: { name: "Test" } });
    render(<WelcomeScreen onContinue={onContinue} />);
    fireEvent.click(screen.getByText("Começar a minerar"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders feature descriptions", () => {
    mockUseAuth.mockReturnValue({ profile: { name: "Test" } });
    render(<WelcomeScreen onContinue={onContinue} />);
    expect(screen.getByText("Descubra os mais vendidos do momento")).toBeInTheDocument();
    expect(screen.getByText("Gere criativos com IA")).toBeInTheDocument();
  });
});
